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
  PreviousFrame,
} from "frames.js/next/server";
import Link from "next/link";
import { DEBUG_HUB_OPTIONS } from "./debug/constants";
import {
  UserRanking,
  getRandomUser,
  getUser,
  setUserRanking,
} from "./db/ranks";
import { Home } from "./components/frames/Home";
import { Play } from "./components/frames/Play";
import { FrameActionDataParsedAndHubContext } from "frames.js";

// Not using any local state, loading everything from server.
type State = {};
const initialState = {
  seen: [],
};

const reducer: FrameReducer<State> = (state, previousFrame) => {
  return state;
};

// This is a react server component only
export default async function Root({
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

  // not used
  const [state] = useFramesReducer<State>(reducer, initialState, previousFrame);

  // Here: do a server side side effect either sync or async (using await), such as minting an NFT if you want.
  // example: load the users credentials & check they have an NFT

  if (frameMessage) {
    // put the state machine switch statement in here
    return await getFrame(previousFrame, frameMessage, state);
  }

  // return the home frame if there is nothing here
  const baseUrl = process.env.NEXT_PUBLIC_HOST || "http://localhost:3000";
  return (
    <div className="p-4">
      frames.js starter kit. The Template Frame is on this page, it&apos;s in
      the html meta tags (inspect source).{" "}
      <Link href={`/debug?url=${baseUrl}`} className="underline">
        Debug
      </Link>
      <Home state={state} previousFrame={previousFrame} />
    </div>
  );
}

async function getFrame(
  previousFrame: PreviousFrame<State>,
  frameMessage: FrameActionDataParsedAndHubContext,
  state: State
) {
  let user;
  try {
    user = await getUser(frameMessage.requesterFid);
  } catch (error) {
    console.error("Failed to get user:", error);
  }
  if (!user) {
    user = await setUserRanking(frameMessage.requesterFid);
  }

  return Play({
    previousFrame: previousFrame,
    state: state,
    frameMessage: frameMessage,
  });
}
