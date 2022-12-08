import { Cast, User } from "@app/model.ts/model";
import axios, { AxiosInstance, AxiosResponse } from "axios";
import _ from "lodash";

const MERKLE_BASE_URL = "https://api.farcaster.xyz";
const MERKLE_CASTS = "/v2/casts";
const MERKLE_USER = "/v2/user";

class MerkleClient {
  private merkle: AxiosInstance;

  constructor() {
    this.merkle = axios.create({
      headers: {
        Authorization: `Bearer ${process.env.MERKLE_TOKEN}`,
      },
    });
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
}

let merkle: MerkleClient;

if (!(global as any).merkle) {
  (global as any).merkle = new MerkleClient();
  merkle = (global as any).merkle;
} else {
  merkle = (global as any).merkle;
}

export default merkle;
