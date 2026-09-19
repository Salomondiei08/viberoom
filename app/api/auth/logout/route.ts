import { NextResponse } from "next/server";
import { cookieName, revokeSession, sessionCookie } from "../../../../lib/auth";
import { apiError, requireSameOrigin } from "../../../../lib/http";
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await revokeSession(sessionCookie(request));
    const response = NextResponse.json({ ok: true });
    response.cookies.set(cookieName, "", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", expires: new Date(0), path: "/" });
    return response;
  } catch (error) { return apiError(error); }
}
