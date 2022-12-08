import merkle, { MERKLE_PAGE_SIZE } from "@app/lib/merkle_client";
import prisma from "@app/lib/prisma_client";
import { f_casts, f_reactions } from "@prisma/client";
import _ from "lodash";
import * as a from "async";

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

let isIndexingAllReactions = false;

export const indexAllReactions = async () => {
  try {
    if (isIndexingAllReactions) {
      console.log("indexAllReactions is still running!");
      return;
    }
    isIndexingAllReactions = true;
    let skip = 0;
    let casts = await prisma.f_casts.findMany({
      select: { hash: true },
      orderBy: { timestamp: "desc" },
      skip,
      take: DB_PAGE_SIZE,
    });

    const allCasts = new Array<string>();

    while (casts.length > 0) {
      allCasts.push(...casts.map((cast) => cast.hash));
      skip += casts.length;
      casts = await prisma.f_casts.findMany({
        select: { hash: true },
        orderBy: { timestamp: "desc" },
        skip,
        take: DB_PAGE_SIZE,
      });
      console.log(allCasts.length);
    }
    const taskList = allCasts.map((castHash) => async (callback: Function) => {
      await indexReaction(castHash);
      callback();
    });

    a.parallelLimit(taskList, 20, (err) => {
      isIndexingAllReactions = false;
      if (err) {
        console.log(err);
      }
    });
  } catch (e) {
    console.log(e);
  }
};
