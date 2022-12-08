export interface User {
  fid: number;
  username: string;
  displayName: string;
  pfp: UserPfp;
  profile: UserProfile;
  followerCount: number;
  followingCount: number;
  referrerUsername: string;
  viewerContext: UserViewerContext;
}

export interface UserPfp {
  url: string;
  verified: boolean;
}

export interface UserProfile {
  bio: UserProfileBio;
}

export interface UserProfileBio {
  text: string;
  mentions: Array<any>;
}

export interface UserViewerContext {
  following: boolean;
  followedBy: boolean;
  canSendDirectCasts: boolean;
}

export interface Cast {
  hash: string;
  threadHash: string;
  parentHash: string;
  parentAuthor: User;
  author: User;
  text: string;
  timestamp: number;
  attachments: any;
  replies: CommonCount;
  reactions: CommonCount;
  recasts: RecastCount;
  watches: CommonCount;
  recast: boolean;
  viewerContext: CastViewerContext;
}

export interface CommonCount {
  count: number;
}

export interface RecastCount extends CommonCount {
  recasters: Array<Recaster>;
}

export interface Recaster {
  fid: number;
  username: string;
  displayName: string;
  recastHash: string;
}

export interface CastViewerContext {
  reacted: boolean;
  recast: boolean;
  watched: boolean;
}
