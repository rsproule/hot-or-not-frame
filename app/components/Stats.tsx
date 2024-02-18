import { User } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { getLeaderBoard, getTotalUsers } from "../db/ranks";
const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";

export async function Stats() {
  const leaderBoard = await getLeaderBoard(1000, 0);
  const users = await Promise.all(
    leaderBoard.map(async (user) => {
      const response = await fetch(`${baseUrl}/api/user?fid=${user.fid}`);
      const userDetails: User = await response.json();
      return { ...user, userDetails };
    })
  );
  const totalPlayer = await getTotalUsers();
  return (
    <div tw="w-full h-full bg-slate-700 text-white flex flex-col items-center justify-center">
      <div tw="text-8xl flex mb-10">
        Top ranked casters out of {totalPlayer} total players:
      </div>
      {users
        .sort((a, b) => a.ranking - b.ranking)
        .map((user) => (
          <div key={user.fid} tw="mb-2 text-4xl">
            {`${user.ranking + 1}: ${user.userDetails.username} - ${
              user.score
            }`}
          </div>
        ))}
    </div>
  );
}
