import { NextResponse } from "next/server";
import { z } from "zod";
import { cookieName, createSession, sessionSeconds, validCredentials } from "../../../../lib/auth";
import { apiError, HttpError, rateLimit, readJson, requireSameOrigin } from "../../../../lib/http";
const schema = z.object({ email: z.string().trim().email().max(254), password: z.string().min(1).max(256) }).strict();
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await rateLimit(request, "login", 8, 15 * 60 * 1000);
    const { email, password } = schema.parse(await readJson(request, 4096));
    if (!validCredentials(email, password)) throw new HttpError(401, "Email ou mot de passe incorrect.");
    const response = NextResponse.json({ ok: true });
    response.cookies.set(cookieName, await createSession(email), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: sessionSeconds, path: "/" });
    return response;
  } catch (error) { return apiError(error); }
}
