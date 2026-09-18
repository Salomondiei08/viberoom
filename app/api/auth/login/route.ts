import { NextResponse } from "next/server";
import { cookieName, createSession } from "../../../../lib/auth";

export const POST = async (request: Request) => {
  const { email, password } = await request.json() as { email?: string; password?: string };
  const expectedEmail = process.env.ADMIN_EMAIL;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedEmail || !expectedPassword) return NextResponse.json({ error: "Le compte administrateur n’est pas configuré sur le serveur." }, { status: 503 });
  if (email !== expectedEmail || password !== expectedPassword) return NextResponse.json({ error: "Email ou mot de passe incorrect." }, { status: 401 });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(cookieName, createSession(email as string), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 7, path: "/" });
  return response;
};
