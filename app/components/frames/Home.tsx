import {
  FrameContainer,
  FrameImage,
  PreviousFrame,
  FrameButton,
} from "frames.js/next/server";
import { State } from "../../page";
import { Stats } from "../Stats";
import { getLeaderBoard, getTotalUsers } from "../../db/ranks";
import { User } from "@neynar/nodejs-sdk/build/neynar-api/v2";

const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";

export interface FrameContext {
  state: State;
  previousFrame: PreviousFrame<State>;
}

export async function Home({ state, previousFrame }: FrameContext) {
  // get the top ranking users
  const leaderBoard = await getLeaderBoard(4, 0);
  const users = await Promise.all(
    leaderBoard.map(async (user) => {
      const response = await fetch(`${baseUrl}/api/user?fid=${user.fid}`);
      const userDetails: User = await response.json();
      return { ...user, userDetails };
    })
  );
  const totalPlayers = await getTotalUsers();
  return (
    <div>
      <Stats limit={1000} />
      <FrameContainer
        postUrl="/frames"
        state={state}
        previousFrame={previousFrame}
      >
        <FrameImage>
          <div tw="w-full h-full bg-slate-700 text-white flex flex-col items-center justify-center">
            <div tw="text-6xl flex mb-10">
              Top casters of {totalPlayers} total players:
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
        </FrameImage>
        <FrameButton action="post">Start Ranking!</FrameButton>
      </FrameContainer>
    </div>
  );
}
