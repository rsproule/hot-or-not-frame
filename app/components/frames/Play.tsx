import { FrameContainer, FrameImage, FrameButton } from "frames.js/next/server";
import { FrameContext } from "./Home";
import { FrameActionDataParsedAndHubContext } from "frames.js";
import { getRandomUser } from "../../db/ranks";
import { User } from "@neynar/nodejs-sdk/build/neynar-api/v2";
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
  let rightUserDetailsReq = await fetch(
    `${baseUrl}/api/user?fid=${rightUser.fid}`
  );
  let leftUserDetailsReq = await fetch(
    `${baseUrl}/api/user?fid=${leftUser.fid}`
  );
  let rightUserDetails: User = await rightUserDetailsReq.json();
  let leftUserDetails: User = await leftUserDetailsReq.json();
  state = { leftUser: leftUser.fid, rightUser: rightUser.fid };
  return (
    <FrameContainer
      postUrl={`/frames`}
      state={state}
      previousFrame={previousFrame}
    >
      <FrameImage>
        <div tw="w-full h-full bg-slate-700 text-white flex justify-center items-center">
          <UserDetails user={leftUserDetails} />
          <div tw="flex p-3">vs</div>
          <UserDetails user={rightUserDetails} />
        </div>
      </FrameImage>
      <FrameButton action="post">{leftUserDetails.username}</FrameButton>
      <FrameButton action="post">{rightUserDetails.username}</FrameButton>
      <FrameButton action="post">Leader Board</FrameButton>
    </FrameContainer>
  );
}

function UserDetails({ user }: { user: User }) {
  return (
    <div tw="flex flex-col justify-center items-center">
      {/* @ts-ignore */}
      <img width={300} height={300} src={user.pfp.url} alt="Image" />
      <div tw="flex">@{user.username}</div>
    </div>
  );
}
