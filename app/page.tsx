import {
  FrameButton,
  FrameContainer,
  FrameImage,
  FrameInput,
  FrameReducer,
  NextServerPageProps,
  getPreviousFrame,
  useFramesReducer,
  getFrameMessage,
} from "frames.js/next/server";
import Link from "next/link";
import { DEBUG_HUB_OPTIONS } from "./debug/constants";
import {
  UserRanking,
  getRandomUser,
  getUser,
  setUserRanking,
} from "./db/ranks";

type State = {};

const initialState = {};

const reducer: FrameReducer<State> = (state, action) => {
  return state;
};

// This is a react server component only
export default async function Home({
  params,
  searchParams,
}: NextServerPageProps) {
  const previousFrame = getPreviousFrame<State>(searchParams);

  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    ...DEBUG_HUB_OPTIONS,
  });

  if (frameMessage && !frameMessage?.isValid) {
    throw new Error("Invalid frame payload");
  }
  console.log({ frameMessage });

  const [state, dispatch] = useFramesReducer<State>(
    reducer,
    initialState,
    previousFrame
  );

  // Here: do a server side side effect either sync or async (using await), such as minting an NFT if you want.
  // example: load the users credentials & check they have an NFT

  console.log("info: state is:", state);

  const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";

  let l_user;
  let r_user;

  if (frameMessage) {
    const {
      isValid,
      buttonIndex,
      inputText,
      castId,
      requesterFid,
      casterFollowsRequester,
      requesterFollowsCaster,
      likedCast,
      recastedCast,
      requesterVerifiedAddresses,
      requesterUserData,
    } = frameMessage;

    // if the user already exists, present them the side by side

    let user;
    try {
      user = await getUser(requesterFid);
    } catch (error) {
      console.error("Failed to get user:", error);
    }
    if (user) {
      console.log("info: frameMessage is:", frameMessage);
      let occlusion = [
        frameMessage?.requesterFid,
        // ...(state.l_user ? [state.l_user.fid] : []),
        // ...(state.r_user ? [state.r_user.fid] : []),
      ];
      l_user = await getRandomUser(occlusion);
      r_user = await getRandomUser([...occlusion, l_user.fid]);
    } else {
      let newUser = await setUserRanking(requesterFid);
      console.log("info: newUser is:", newUser);
    }
  }

  // then, when done, return next frame
  return (
    <div className="p-4">
      frames.js starter kit. The Template Frame is on this page, it&apos;s in
      the html meta tags (inspect source).{" "}
      <Link href={`/debug?url=${baseUrl}`} className="underline">
        Debug
      </Link>
      <FrameContainer
        postUrl="/frames"
        state={state}
        previousFrame={previousFrame}
      >
        <FrameImage>
          <div tw="w-full h-full bg-slate-700 text-white justify-center items-center">
            {r_user && l_user ? `@${l_user.fid} vs @${r_user.fid}` : "home"}
          </div>
        </FrameImage>
        <FrameButton action="post">Play</FrameButton>
      </FrameContainer>
    </div>
  );
}
