import { UserDataReturnType } from "frames.js";
import { UserIdentifierInput, parseIdentifier } from "../frame-std-input/user";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { kv } from "@vercel/kv";

const TABLE_NAME = "ranks";
const USER_INITIAL_RANKING = 800;

// https://redis.io/docs/data-types/sorted-sets/#updating-the-score-leaderboardsF
export async function setUserRanking(
  fid: number,
  ranking: number | undefined
): Promise<number> {
  let scoreMember = { score: ranking ?? USER_INITIAL_RANKING, member: fid };
  let addResponse = await kv.zadd(TABLE_NAME, scoreMember);
  if (!addResponse) {
    throw new Error("Failed to add user ranking");
  }
  return addResponse;
}

export async function getUserRanking(user: number): Promise<number> {
  let r = await kv.zrank(TABLE_NAME, user);
  if (!r) {
    throw new Error("Failed to get user ranking");
  }
  return r;
}

export async function getTotalUsers(): Promise<number> {
  let r = await kv.zcard(TABLE_NAME);
  if (!r) {
    throw new Error("Failed to get total users");
  }
  return r;
}

export async function getUserScore(user: number): Promise<number> {
  let r = await kv.zscore(TABLE_NAME, user);
  if (!r) {
    throw new Error("Failed to get user score");
  }
  return r;
}

export async function getRandomeUser(
  occluded: number[] = []
): Promise<UserRanking> {
  let card = await kv.zcard(TABLE_NAME);
  if (!card) {
    throw new Error("Failed to get random user");
  }
  let rando;
  do {
    rando = Math.floor(Math.random() * card);
  } while (occluded.includes(rando));

  let r = await kv.zrange(TABLE_NAME, rando, rando);
  if (!r) {
    console.warn("Failed to get random user");
  }
  let score = await kv.zscore(TABLE_NAME, r[0]!);
  return { fid: r[0]!, ranking: rando, score: score! } as UserRanking;
}

export async function getLeaderBoard(
  limit: number,
  paginator: number = 0
): Promise<UserRanking[]> {
  let r: number[] = await kv.zrange(TABLE_NAME, paginator, paginator + limit, {
    withScores: true,
  });
  let leaderboard: UserRanking[] = [];
  for (let i = 0; i < r.length; i += 2) {
    let userRanking: UserRanking = {
      fid: r[i]!,
      score: r[i + 1]!,
      ranking: paginator + i / 2,
    };
    leaderboard.push(userRanking);
  }
  return leaderboard;
}

interface UserRanking {
  fid: number;
  ranking: number;
  score: number;
}