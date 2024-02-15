import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { UserResponse } from "@neynar/nodejs-sdk/build/neynar-api/v2";

export type UserIdentifierInput = "${number}" | string;
enum UserIdentifier {
  FID,
  USERNAME,
}
interface TypedUserIdentifier {
  type: UserIdentifier;
  value: UserIdentifierInput;
}
export async function parseIdentifiersInBatch(
  client: NeynarAPIClient,
  identifiers: UserIdentifierInput[]
): Promise<number[]> {
  return await Promise.all(
    identifiers.map((identifier: UserIdentifierInput) => {
      return parseIdentifier(client, identifier);
    })
  );
}

export async function parseIdentifier(
  client: NeynarAPIClient,
  identifier: UserIdentifierInput
): Promise<number> {
  let input = getInputTyped(identifier);
  switch (input.type) {
    case UserIdentifier.FID:
      return parseInt(input.value);
    case UserIdentifier.USERNAME:
      let user = await client.lookupUserByUsername(input.value);
      return user.result.user.fid;
  }
}

function getInputTyped(
  userIdentifier: UserIdentifierInput
): TypedUserIdentifier {
  if (typeof userIdentifier === "string") {
    if (userIdentifier.startsWith("@")) {
      return { type: UserIdentifier.USERNAME, value: userIdentifier.slice(1) };
    } else {
      return { type: UserIdentifier.USERNAME, value: userIdentifier };
    }
  } else if (typeof userIdentifier === "number") {
    return { type: UserIdentifier.FID, value: userIdentifier };
  }
  throw new Error("Invalid user identifier");
}
