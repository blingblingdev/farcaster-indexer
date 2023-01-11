import merkle, { MERKLE_PAGE_SIZE } from "@app/lib/merkle_client";
import prisma from "@app/lib/prisma_client";
import { f_casts, f_reactions } from "@prisma/client";
import _ from "lodash";
import * as a from "async";
import PromisePool from "@supercharge/promise-pool/dist";

const DB_PAGE_SIZE = 10000;

const indexReaction = async (castHash: string) => {
  try {
    // find the latest cast and recast in db
    const latestReactionInDB = await prisma.f_reactions.findFirst({
      select: { hash: true },
      where: { cast_hash: castHash },
      orderBy: { timestamp: "desc" },
    });
    const latestReactionHashInDB = latestReactionInDB
      ? latestReactionInDB.hash
      : "";

    let [reactions, cursor] = await merkle.getCastLikes(
      castHash,
      MERKLE_PAGE_SIZE
    );

    if (reactions.length === 0) {
      console.log(`cast: ${castHash} has no reactions`);
      return;
    }

    let newReactionCount = 0;
    while (reactions.length > 0) {
      const newReactions = new Array<f_reactions>();

      for (const reaction of reactions) {
        // incrementally index casts
        if (reaction.hash === latestReactionHashInDB) {
          cursor = "";
          break;
        }

        const newReaction = {
          hash: reaction.hash,
          cast_hash: reaction.castHash,
          reaction_type: reaction.type,
          timestamp: new Date(reaction.timestamp),
        } as f_reactions;
        if (!_.isEmpty(reaction.reactor)) {
          newReaction.fid = BigInt(reaction.reactor.fid);
        }
        newReactions.push(newReaction);
      }

      // create new reactions
      if (newReactions.length > 0) {
        await prisma.f_reactions.createMany({
          data: newReactions,
          skipDuplicates: true,
        });
      }

      newReactionCount += newReactions.length;

      if (!cursor) {
        break;
      }
      [reactions, cursor] = await merkle.getCastLikes(
        castHash,
        MERKLE_PAGE_SIZE,
        cursor
      );
    }
    console.log(
      `saved newReactions count: ${newReactionCount} for cast: ${castHash}`
    );
  } catch (e) {
    console.log(`index cast reaction: ${castHash} error: ${e}`);
  }
};

export const indexAllReactions = async () => {
  try {
    let skip = 0;
    let casts = await prisma.f_casts.findMany({
      select: { hash: true },
      orderBy: { timestamp: "desc" },
      skip,
      take: DB_PAGE_SIZE,
    });

    while (casts.length > 0) {
      await PromisePool.withConcurrency(20)
        .for(casts.map((cast) => cast.hash))
        .process(async (castHash: string) => {
          await indexReaction(castHash);
        });
      if (skip % 1000 === 0) {
        console.log(`reaction indexing checkpoint skip: ${skip}`);
      }

      skip += casts.length;
      casts = await prisma.f_casts.findMany({
        select: { hash: true },
        orderBy: { timestamp: "desc" },
        skip,
        take: DB_PAGE_SIZE,
      });
    }
  } catch (e) {
    console.log(e);
  }
};
