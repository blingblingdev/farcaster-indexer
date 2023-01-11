import prisma from "@app/lib/prisma_client";
import { Cast, Reaction, User } from "@app/model/model";
import { f_users } from "@prisma/client";
import axios, { Axios, AxiosInstance, AxiosRequestConfig } from "axios";

const MERKLE_BASE_URL = "https://api.farcaster.xyz";
const MERKLE_CASTS = "/v2/casts";
const MERKLE_CAST_LIKES = "/v2/cast-likes";
const MERKLE_USER = "/v2/user";
export const MERKLE_PAGE_SIZE = 100;

const Performance = require("perf_hooks").performance;
let qpsMap = new Map();
const qpsController =
  (QPS = 18, OFFSET = 0) =>
  async (config: AxiosRequestConfig) => {
    const now = Math.trunc(Performance.timeOrigin + Performance.now()); // Math.trunc(1597224439841.351)=1597224439841
    let { count, ts } = qpsMap.get("count") || {
      count: 1,
      ts: now,
    };

    if ((now / 1000) >> 0 <= (ts / 1000) >> 0) {
      if (count < QPS) {
        count++;
      } else {
        ts = 1000 * Math.ceil(ts / 1000 + 1);
        count = 1;
      }
    } else {
      ts = now;
      count = 1;
    }
    qpsMap.set("count", {
      count,
      ts,
    });

    let sleep = ts - now;
    sleep = sleep > 0 ? sleep + OFFSET : 0;
    await new Promise((resolve) => setTimeout(() => resolve(0), sleep));
    return config;
  };

class MerkleClient {
  private merkle: AxiosInstance;

  constructor() {
    this.merkle = axios.create({
      headers: {
        Authorization: `Bearer ${process.env.MERKLE_TOKEN}`,
      },
    });
    this.merkle.interceptors.request.use(qpsController());
  }

  async getCasts(
    fid: number,
    limit: number = 25,
    cursor?: string
  ): Promise<[Array<Cast>, string]> {
    const params = { fid: fid, limit: limit } as any;
    if (cursor) {
      params.cursor = cursor;
    }
    const resp = await this.merkle.get(`${MERKLE_BASE_URL}${MERKLE_CASTS}`, {
      params,
    });
    return [resp.data.result.casts as Array<Cast>, resp.data.next?.cursor];
  }

  async getUser(fid: number): Promise<User | undefined> {
    const resp = await this.merkle.get(`${MERKLE_BASE_URL}${MERKLE_USER}`, {
      params: { fid },
      validateStatus: (status: number) => {
        return status < 500;
      },
    });
    if (resp.status === 404) {
      return undefined;
    }
    return resp.data.result.user as User;
  }

  getCastLikes = async (
    castHash: string,
    limit: number = 25,
    cursor?: string
  ): Promise<[Array<Reaction>, string]> => {
    const params = { castHash, limit } as any;
    if (cursor) {
      params.cursor = cursor;
    }
    const resp = await this.merkle.get(
      `${MERKLE_BASE_URL}${MERKLE_CAST_LIKES}`,
      {
        params,
      }
    );
    return [resp.data.result.likes as Array<Reaction>, resp.data.next?.cursor];
  };

  getNewestFid = async () => {
    const newestFidInDB = await prisma.f_users.findFirst({
      select: { fid: true },
      orderBy: { fid: "desc" },
    });
    let newestFid = newestFidInDB ? Number(newestFidInDB.fid) : 0;
    let user = await merkle.getUser(newestFid + 1);
    while (user) {
      await this.upsertUser(user);
      newestFid++;
      user = await merkle.getUser(newestFid + 1);
    }
    return newestFid;
  };

  // upsert user
  upsertUser = async (user: User) => {
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
}

let merkle: MerkleClient;

if (!(global as any).merkle) {
  (global as any).merkle = new MerkleClient();
  merkle = (global as any).merkle;
} else {
  merkle = (global as any).merkle;
}

export default merkle;
