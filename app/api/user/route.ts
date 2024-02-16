import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { NextRequest } from "next/server";

import { NextResponse } from "next/server";

export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = req.nextUrl;
  const fid = searchParams.get("fid");

  const client = new NeynarAPIClient(process.env.NEYNAR_KEY!);
  const user = await client.lookupUserByFid(Number(fid));

  return new NextResponse(JSON.stringify(user.result.user), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "s-maxage=86400, stale-while-revalidate",
    },
  });
}
