import { createHash, createHmac, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";
import { changeStore, readStore } from "./storage";
import { HttpError } from "./http";
export const cookieName = "viberoom_session";
export const sessionSeconds = 60 * 60 * 8;
type Session = { email: string; exp: number; id: string };
type Sessions = Record<string, number>;

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) throw new HttpError(503, "La connexion est momentanément indisponible.");
  return value;
}
const sign = (payload: string) => createHmac("sha256", secret()).update(`${payload}:${process.env.ADMIN_EMAIL}:${process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD || ""}`).digest("hex");
const equal = (a: string, b: string) => timingSafeEqual(createHash("sha256").update(a).digest(), createHash("sha256").update(b).digest());

/** Accept a salted scrypt hash; retain compatibility during credential migration. */
export function validCredentials(email: string, password: string): boolean {
  secret();
  if (!process.env.ADMIN_EMAIL || !(process.env.ADMIN_PASSWORD_HASH || process.env.ADMIN_PASSWORD)) throw new HttpError(503, "La connexion est momentanément indisponible.");
  let passwordValid = false;
  if (process.env.ADMIN_PASSWORD_HASH) {
    const [scheme, salt, hash] = process.env.ADMIN_PASSWORD_HASH.split(":");
    if (scheme !== "scrypt" || !salt || !/^[a-f0-9]{128}$/.test(hash ?? "")) throw new HttpError(503, "La connexion est momentanément indisponible.");
    passwordValid = timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(hash, "hex"));
  } else passwordValid = equal(password, process.env.ADMIN_PASSWORD!);
  return equal(email.toLowerCase().trim(), process.env.ADMIN_EMAIL.toLowerCase().trim()) && passwordValid;
}

/** A server-side allowlist makes logout invalidate copied session cookies too. */
export async function createSession(email: string): Promise<string> {
  const session: Session = { email: email.toLowerCase().trim(), exp: Date.now() + sessionSeconds * 1000, id: randomUUID() };
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  const signature = sign(payload);
  await changeStore<Sessions, void>("sessions.json", {}, sessions => {
    for (const [id, exp] of Object.entries(sessions)) if (exp <= Date.now()) delete sessions[id];
    sessions[session.id] = session.exp;
  });
  return `${payload}.${signature}`;
}
function decode(cookie: string | undefined): Session | undefined {
  if (!cookie || cookie.length > 2048) return undefined;
  const parts = cookie.split(".");
  if (parts.length !== 2 || !/^[a-f0-9]{64}$/.test(parts[1])) return undefined;
  try {
    if (!equal(parts[1], sign(parts[0]))) return undefined;
    const payload = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf8")) as Session;
    if (!payload || typeof payload.email !== "string" || payload.email !== process.env.ADMIN_EMAIL?.trim().toLowerCase() || !Number.isFinite(payload.exp) || payload.exp <= Date.now() || typeof payload.id !== "string") return undefined;
    return payload;
  } catch { return undefined; }
}
export async function verifySession(cookie: string | undefined): Promise<boolean> {
  const session = decode(cookie);
  if (!session) return false;
  const sessions = await readStore<Sessions>("sessions.json", {});
  return sessions[session.id] === session.exp;
}
export async function revokeSession(cookie: string | undefined): Promise<void> {
  const session = decode(cookie);
  if (session) await changeStore<Sessions, void>("sessions.json", {}, sessions => { delete sessions[session.id]; });
}
export function sessionCookie(request: Request): string | undefined {
  return request.headers.get("cookie")?.split(";").map(value => value.trim()).find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
}
export async function requireAdmin(request: Request): Promise<void> {
  if (!await verifySession(sessionCookie(request))) throw new HttpError(401, "Ta session a expiré. Connecte-toi pour accéder aux projets.");
}
