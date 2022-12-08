import merkle from "@app/lib/merkle_client";
import prisma from "@app/lib/prisma_client";
import { f_casts, f_recasts, f_users } from "@prisma/client";
import _ from "lodash";
import * as a from "async";
import { User } from "@app/model.ts/model";
import { schedule } from "node-cron";
const PAGE_SIZE = 100;

const indexCast = async (fid: number, callback: Function) => {
  try {
    let user = await merkle.getUser(fid);
    if (!user) {
      return;
    }
    let newCastCount = 0,
      newRecastCount = 0;

    // find the latest cast and recast in db
    const latestCastInDB = await prisma.f_casts.findFirst({
      select: { hash: true },
      where: { author_fid: fid },
      orderBy: { timestamp: "desc" },
    });
    const latestCastHashInDB = latestCastInDB ? latestCastInDB.hash : "";
    const latestRecastInDB = await prisma.f_recasts.findFirst({
      select: { hash: true },
      where: { fid },
      orderBy: { ctime: "desc" },
    });
    const latestRecastHashInDB = latestRecastInDB ? latestRecastInDB.hash : "";

    let [casts, cursor] = await merkle.getCasts(fid, PAGE_SIZE);
    if (casts.length === 0) {
      console.log(`fid: ${fid} has no casts`);
      return;
    }

    while (casts.length > 0) {
      const newCasts = new Array<f_casts>();
      const newRecasts = new Array<f_recasts>();

      for (const cast of casts) {
        // incrementally index casts
        if (
          cast.hash === latestCastHashInDB ||
          cast.hash === latestRecastHashInDB
        ) {
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
      [casts, cursor] = await merkle.getCasts(fid, PAGE_SIZE, cursor);
    }
    console.log(
      `saved data for fid: ${fid}, newCasts count: ${newCastCount}, newRecasts count: ${newRecastCount}`
    );
  } catch (e: any) {
    console.log(`index fid: ${fid} error: ${e}`);
  } finally {
    callback();
  }
};

// upsert user
const upsertUser = async (user: User) => {
  const newUser = {
    fid: BigInt(user.fid),
    username: user.username,
    display_name: user.displayName,
    pfp_url: user.pfp?.url,
    pfp_verified: user.pfp?.verified,
    profile_bio_text: user.profile?.bio?.text,
    follower_count: user.followerCount,
    following_count: user.followingCount,
  } as f_users;
  const count = await prisma.f_users.count({
    where: { fid: newUser.fid },
  });
  if (count > 0) {
    await prisma.f_users.update({
      data: {
        username: newUser.username,
        display_name: newUser.display_name,
        pfp_url: newUser.pfp_url,
        pfp_verified: newUser.pfp_verified,
        profile_bio_text: newUser.profile_bio_text,
        follower_count: newUser.follower_count,
        following_count: newUser.following_count,
      },
      where: {
        fid: newUser.fid,
      },
    });
  } else {
    await prisma.f_users.create({ data: newUser });
  }
};

const getNewestFid = async () => {
  const newestFidInDB = await prisma.f_users.findFirst({
    select: { fid: true },
    orderBy: { fid: "desc" },
  });
  let newestFid = newestFidInDB ? Number(newestFidInDB.fid) : 0;
  let user = await merkle.getUser(newestFid + 1);
  while (user) {
    await upsertUser(user);
    newestFid++;
    user = await merkle.getUser(newestFid + 1);
  }
  return newestFid;
};

export const indexAllCasts = async () => {
  try {
    const newestFid = await getNewestFid();
    const fidList = _.range(1, newestFid);
    a.eachLimit(fidList, 10, indexCast, (err) => {
      if (err) {
        console.log(err);
      }
    });
  } catch (e) {
    console.log(e);
  }
};

const indexAllCastsJob = schedule("*/30 * * * *", indexAllCasts);

export const initJobs = async () => {
  indexAllCastsJob.start();
};

export const stopJobs = () => {
  indexAllCastsJob.stop();
};
