import {
  FrameContainer,
  FrameImage,
  PreviousFrame,
  FrameButton,
} from "frames.js/next/server";
import Link from "next/link";
import { State } from "swr";
import { getLeaderBoard } from "../../db/ranks";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { User } from "@neynar/nodejs-sdk/build/neynar-api/v2";
const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";

export interface FrameContext {
  state: State;
  previousFrame: PreviousFrame<State>;
}

export async function Home({ state, previousFrame }: FrameContext) {
  // get the top ranking users
  const leaderBoard = await getLeaderBoard(5, 0);
  const users = await Promise.all(
    leaderBoard.map(async (user) => {
      const response = await fetch(`${baseUrl}/api/user?fid=${user.fid}`);
      const userDetails: User = await response.json();
      return { ...user, userDetails };
    })
  );
  return (
    <FrameContainer
      postUrl="/frames"
      state={state}
      previousFrame={previousFrame}
    >
      <FrameImage>
        <div tw="w-full h-full bg-slate-700 text-white flex flex-col items-center justify-center">
          <div tw="text-2xl mb-4">Top players:</div>
          {users
            .sort((a, b) => a.ranking - b.ranking)
            .map((user) => (
              <div key={user.fid} tw="mb-2">
                {`${user.ranking}: ${user.userDetails.username} - ${user.score}`}
              </div>
            ))}
        </div>
      </FrameImage>
      <FrameButton action="post">Start Ranking!</FrameButton>
    </FrameContainer>
  );
}
