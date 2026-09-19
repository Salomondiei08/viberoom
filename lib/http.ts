import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { changeStore } from "./storage";
export class HttpError extends Error {
  constructor(public status: number, message: string, public retryAfter?: number) { super(message); }
}
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const expected = new URL(process.env.APP_ORIGIN || request.url).origin;
  if (request.headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== expected)) throw new HttpError(403, "Cette origine n’est pas autorisée.");
}
/** Bound streamed bodies as Content-Length is optional and untrusted. */
export async function readJson(request: Request, limit = 16384): Promise<unknown> {
  if (request.headers.get("content-type")?.split(";")[0].trim() !== "application/json") throw new HttpError(415, "Format JSON requis.");
  if (Number(request.headers.get("content-length")) > limit) throw new HttpError(413, "Le formulaire est trop volumineux.");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "Le formulaire est vide.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new HttpError(413, "Le formulaire est trop volumineux."); }
      chunks.push(value);
    }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw new HttpError(400, "Le formulaire est invalide."); }
  } finally { reader.releaseLock(); }
}
/** Persistent counters survive restarts. Only trust the IP appended by our proxy. */
export async function rateLimit(request: Request, bucket: string, max: number, windowMs: number) {
  const address = process.env.TRUST_PROXY === "true" ? request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "unknown" : "local";
  const key = `${bucket}:${createHash("sha256").update(address).digest("hex")}`;
  const now = Date.now();
  const result = await changeStore<Record<string, { count: number; until: number }>, number>("rate-limits.json", {}, counters => {
    for (const [id, counter] of Object.entries(counters)) if (counter.until <= now) delete counters[id];
    if (!counters[key]) {
      if (Object.keys(counters).length >= 10000) return 60;
      counters[key] = { count: 0, until: now + windowMs };
    }
    const counter = counters[key];
    if (counter.count >= max) return Math.ceil((counter.until - now) / 1000);
    counter.count += 1;
    return 0;
  });
  if (result) throw new HttpError(429, "Trop de tentatives. Réessaie dans quelques minutes.", result);
}
export function apiError(error: unknown): NextResponse {
  if (error instanceof ZodError) return NextResponse.json({ error: error.issues[0]?.message || "Vérifie les champs du formulaire." }, { status: 400 });
  if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status, headers: error.retryAfter ? { "Retry-After": String(error.retryAfter) } : {} });
  console.error("VibeRoom API failure", error instanceof Error ? error.name : "UnknownError");
  return NextResponse.json({ error: "Le service est momentanément indisponible. Réessaie dans un instant." }, { status: 503 });
}
