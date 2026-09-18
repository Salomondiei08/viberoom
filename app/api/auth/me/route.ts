import { NextRequest, NextResponse } from "next/server";
import { cookieName, verifySession } from "../../../../lib/auth";

export const GET = (request: NextRequest) => NextResponse.json({ authenticated: verifySession(request.cookies.get(cookieName)?.value) });
