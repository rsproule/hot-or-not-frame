import {
  FrameReducer,
  NextServerPageProps,
  getPreviousFrame,
  useFramesReducer,
  getFrameMessage,
  PreviousFrame,
} from "frames.js/next/server";
import { DEBUG_HUB_OPTIONS } from "./debug/constants";
import { UserRanking, getUser, setUserRanking } from "./db/ranks";
import { Home } from "./components/frames/Home";
import { Play } from "./components/frames/Play";
import { FrameActionDataParsedAndHubContext } from "frames.js";

// Not using any local state, loading everything from server.
export type State = {
  leftUser?: number;
  rightUser?: number;
};

const initialState = {};

const reducer: FrameReducer<State> = (state, previousFrame) => {
  return state;
};

// This is a react server component only
export default async function Root({
  params,
  searchParams,
}: NextServerPageProps) {
  const previousFrame = getPreviousFrame<State>(searchParams);
  const [state] = useFramesReducer<State>(reducer, initialState, previousFrame);

  const frameMessage = await getFrameMessage(previousFrame.postBody, {
    ...DEBUG_HUB_OPTIONS,
  });

  if (frameMessage && !frameMessage?.isValid) {
    throw new Error("Invalid frame payload");
  }

  if (frameMessage) {
    // put the state machine switch statement in here
    let rankMatch = await getRankMatch(state);
    if (rankMatch) {
      if (frameMessage.buttonIndex === 1) {
        await applyMatchResult(rankMatch.rightUser, rankMatch.leftUser);
      } else if (frameMessage.buttonIndex === 2) {
        await applyMatchResult(rankMatch.leftUser, rankMatch.rightUser);
      }
    }

    return await getFrame(previousFrame, frameMessage, state);
  }

  return <Home state={state} previousFrame={previousFrame} />;
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
    console.log("User not found, created new user:", user);
  }

  return Play({
    previousFrame: previousFrame,
    state: state,
    frameMessage: frameMessage,
  });
}

async function getRankMatch(
  state: State
): Promise<{ leftUser: UserRanking; rightUser: UserRanking } | undefined> {
  const leftUserId = state?.leftUser;
  const rightUserId = state?.rightUser;
  if (
    !leftUserId ||
    !rightUserId ||
    isNaN(Number(leftUserId)) ||
    isNaN(Number(rightUserId))
  ) {
    console.error("Invalid user ids:", leftUserId, rightUserId);
    return undefined;
  }

  let leftUser, rightUser;
  try {
    leftUser = await getUser(Number(leftUserId));
    rightUser = await getUser(Number(rightUserId));
  } catch (error) {
    console.error("Failed to get users:", error);
    return undefined;
  }

  return {
    leftUser,
    rightUser,
  };
}

async function applyMatchResult(loser: UserRanking, winner: UserRanking) {
  let loserScoreBefore = loser.score;
  let winnerScoreBefore = winner.score;
  // Score rating constants
  const K_FACTOR = 32;
  const EXPECTED_SCORE_DIVISOR = 400;

  // Calculate expected scores
  const expectedScoreLoser =
    1 /
    (1 +
      Math.pow(
        10,
        (winnerScoreBefore - loserScoreBefore) / EXPECTED_SCORE_DIVISOR
      ));
  const expectedScoreWinner =
    1 /
    (1 +
      Math.pow(
        10,
        (loserScoreBefore - winnerScoreBefore) / EXPECTED_SCORE_DIVISOR
      ));

  // Update score ratings
  const updatedLoserScore =
    Number(loserScoreBefore) + K_FACTOR * (0 - Number(expectedScoreLoser));
  const updatedWinnerScore =
    Number(winnerScoreBefore) + K_FACTOR * (1 - Number(expectedScoreWinner));

  // Update user scores
  loser.score = updatedLoserScore;
  winner.score = updatedWinnerScore;

  // Save updated scores
  let loserNewScore = await setUserRanking(loser.fid, loser.score);
  let winnerNewScore = await setUserRanking(winner.fid, winner.score);
  return { loserNewScore, winnerNewScore };
}
