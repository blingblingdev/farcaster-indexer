import merkle, { MERKLE_PAGE_SIZE } from "@app/lib/merkle_client";
import prisma from "@app/lib/prisma_client";
import { f_casts, f_recasts } from "@prisma/client";
import * as a from "async";
import _ from "lodash";

const indexCast = async (fid: number) => {
  try {
    let user = await merkle.getUser(fid);
    if (!user) {
      return;
    }

    // find the latest cast and recast in db
    const latestCastInDB = await prisma.f_casts.findFirst({
      select: { hash: true },
      where: { author_fid: fid },
      orderBy: { timestamp: "desc" },
    });
    const latestCastHashInDB = latestCastInDB ? latestCastInDB.hash : "";

    let [casts, cursor] = await merkle.getCasts(fid, MERKLE_PAGE_SIZE);
    if (casts.length === 0) {
      console.log(`fid: ${fid} has no casts`);
      return;
    }

    let newCastCount = 0,
      newRecastCount = 0;
    while (casts.length > 0) {
      const newCasts = new Array<f_casts>();
      const newRecasts = new Array<f_recasts>();

      for (const cast of casts) {
        // incrementally index casts
        if (!cast.recast && cast.hash === latestCastHashInDB) {
          cursor = "";
          break;
        }
        if (cast.recast) {
          cast.recasts.recasters.forEach((value) => {
            const newRecast = {
              hash: cast.hash,
              thread_hash: cast.threadHash,
              parent_hash: cast.parentHash,
              recast_hash: value.recastHash,
              fid: BigInt(value.fid),
            } as f_recasts;
            newRecasts.push(newRecast);
          });
        } else {
          const newCast = {
            hash: cast.hash,
            thread_hash: cast.threadHash,
            author_fid: BigInt(cast.author.fid),
            text: cast.text,
            timestamp: new Date(cast.timestamp),
            attachments: JSON.stringify(cast.attachments),
          } as f_casts;
          if (!_.isEmpty(cast.parentAuthor)) {
            newCast.parent_hash = cast.parentHash;
            newCast.parent_author_fid = BigInt(cast.parentAuthor.fid);
          }
          newCasts.push(newCast);
        }
      }

      // create new casts and ignore existed casts
      if (newCasts.length > 0) {
        await prisma.f_casts.createMany({
          data: newCasts,
          skipDuplicates: true,
        });
      }

      // create new recasts and ignore existed recasts
      if (newRecasts.length > 0) {
        await prisma.f_recasts.createMany({
          data: newRecasts,
          skipDuplicates: true,
        });
      }

      newCastCount += newCasts.length;
      newRecastCount += newRecasts.length;

      if (!cursor) {
        break;
      }
      [casts, cursor] = await merkle.getCasts(fid, MERKLE_PAGE_SIZE, cursor);
    }
    console.log(
      `saved data for fid: ${fid}, newCasts count: ${newCastCount}, newRecasts count: ${newRecastCount}`
    );
  } catch (e: any) {
    console.log(`index fid: ${fid} error: ${e}`);
  }
};

let isIndexingAllCasts = false;

export const indexAllCasts = async () => {
  try {
    if (isIndexingAllCasts) {
      console.log("indexAllCasts is still running!");
      return;
    }
    isIndexingAllCasts = true;
    const newestFid = await merkle.getNewestFid();
    const fidList = _.range(1, newestFid);
    const taskList = fidList.map(
      (fid) =>
        async function (callback: Function) {
          await indexCast(fid);
          callback();
        }
    );
    a.parallelLimit(taskList, 20, (err) => {
      isIndexingAllCasts = false;
      if (err) {
        console.log(err);
      }
    });
  } catch (e) {
    console.log(e);
  }
};