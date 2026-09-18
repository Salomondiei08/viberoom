import { createHmac, timingSafeEqual } from "node:crypto";

export const cookieName = "viberoom_session";
const sign = (value: string) => createHmac("sha256", process.env.AUTH_SECRET || "local-change-me").update(value).digest("hex");

export const createSession = (email: string) => {
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + 1000 * 60 * 60 * 24 * 7 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
};

export const verifySession = (cookie: string | undefined) => {
  if (!cookie) return false;
  const [payload, signature] = cookie.split(".");
  if (!payload || !signature) return false;
  const expected = sign(payload);
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).exp > Date.now(); } catch { return false; }
};
