import { FrameContainer, FrameImage, FrameButton } from "frames.js/next/server";
import { FrameContext } from "./Home";
import { FrameActionDataParsedAndHubContext } from "frames.js";
import { getRandomUser } from "../../db/ranks";
const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";

interface PlayFrameContext extends FrameContext {
  frameMessage: FrameActionDataParsedAndHubContext;
  lastLeftUser?: number;
  lastRightUser?: number;
}

export async function Play({
  state,
  previousFrame,
  frameMessage,
  lastLeftUser,
  lastRightUser,
}: PlayFrameContext) {
  let occlusion = [
    frameMessage?.requesterFid,
    ...(lastLeftUser ? [lastLeftUser] : []),
    ...(lastRightUser ? [lastRightUser] : []),
  ];
  let leftUser = await getRandomUser(occlusion);
  let rightUser = await getRandomUser([...occlusion, leftUser.fid]);
  return (
    <FrameContainer
      postUrl={`/frames?state=Play&l=${leftUser.fid}&r=${rightUser.fid}`}
      state={state}
      previousFrame={previousFrame}
    >
      <FrameImage>
        <div tw="w-full h-full bg-slate-700 text-white flex justify-center items-center">
          <div>{`@${leftUser.fid} vs @${rightUser.fid}`}</div>
        </div>
      </FrameImage>
      <FrameButton action="post">{leftUser.fid}</FrameButton>
      <FrameButton action="post">{rightUser.fid}</FrameButton>
    </FrameContainer>
  );
}
