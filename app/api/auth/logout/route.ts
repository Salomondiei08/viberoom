import { NextResponse } from "next/server";

export const POST = () => { const response = NextResponse.json({ ok: true }); response.cookies.set("viberoom_session", "", { httpOnly: true, expires: new Date(0), path: "/" }); return response; };
