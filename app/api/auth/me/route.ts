import { NextResponse } from "next/server";
import { sessionCookie, verifySession } from "../../../../lib/auth";
import { apiError } from "../../../../lib/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { return NextResponse.json({ authenticated: await verifySession(sessionCookie(request)) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return apiError(error); }
}
