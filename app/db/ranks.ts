import { kv } from "@vercel/kv";

const TABLE_NAME = "ranks";
const USER_INITIAL_RANKING = 800;

// https://redis.io/docs/data-types/sorted-sets/#updating-the-score-leaderboardsF
export async function setUserRanking(
  fid: number,
  ranking: number | undefined = undefined
): Promise<number> {
  let scoreMember = { score: ranking ?? USER_INITIAL_RANKING, member: fid };
  let addResponse = await kv.zadd(TABLE_NAME, scoreMember);
  if (addResponse === null) {
    throw new Error("Failed to add user ranking");
  }
  return addResponse;
}

export async function logVote(winner: number, loser: number): Promise<number> {
  let timestamp = Date.now();
  let p = await kv.lpush("votes", `${timestamp}|${winner}|${loser}`);
  if (p === null) {
    throw new Error("Failed to log vote");
  }
  return p;
}

export async function getUser(user: number): Promise<UserRanking> {
  let rank = await getUserRanking(user);
  let score = await getUserScore(user);
  let userRanking: UserRanking = { fid: user, ranking: rank, score: score };
  return userRanking;
}

export async function getUserRanking(user: number): Promise<number> {
  let r = await kv.zrevrank(TABLE_NAME, user);
  if (r === null) {
    throw new Error("Failed to get user ranking");
  }
  return r;
}

export async function getUserScore(user: number): Promise<number> {
  let r = await kv.zscore(TABLE_NAME, user);
  if (r === null) {
    throw new Error("Failed to get user score");
  }
  return r;
}

export async function getTotalUsers(): Promise<number> {
  let r = await kv.zcard(TABLE_NAME);
  if (r === null) {
    throw new Error("Failed to get total users");
  }
  return r;
}

export async function getRandomUser(
  occluded: number[] = []
): Promise<UserRanking> {
  let card = await kv.zcard(TABLE_NAME);
  if (card === null || card < occluded.length) {
    if (card < occluded.length) {
      throw new Error("Occluded length is greater than the total users");
    }
    throw new Error("Failed to get random user");
  }
  let randomRank;
  let randomFid: number[] = [];
  do {
    randomRank = Math.floor(Math.random() * card);
    randomFid = await kv.zrange(TABLE_NAME, randomRank, randomRank);
  } while (randomFid.length === 1 && occluded.includes(randomFid[0]!));

  let userRanking = await getUser(randomFid[0]!);
  return userRanking;
}

export async function getLeaderBoard(
  limit: number,
  paginator: number = 0
): Promise<UserRanking[]> {
  let r: number[] = await kv.zrange(
    TABLE_NAME,
    paginator,
    paginator + limit - 1,
    {
      withScores: true,
      rev: true,
    }
  );
  let leaderboard: UserRanking[] = [];
  for (let i = 0; i < r.length; i += 2) {
    let userRanking: UserRanking = {
      fid: r[i]!,
      score: Number(Number(r[i + 1]!).toFixed(2)),
      ranking: paginator + i / 2,
    };
    leaderboard.push(userRanking);
  }
  return leaderboard;
}

export interface UserRanking {
  fid: number;
  ranking: number;
  score: number;
}
