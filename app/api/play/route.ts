import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<Response> {
   
  return new NextResponse("ok", {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}
