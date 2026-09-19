import { z } from "zod";
export const statuses = ["Nouveau", "À suivre", "Jugé"] as const;
export type Status = typeof statuses[number];
export type Application = { id: number; name: string; location: string; focus: string; bio: string; status: Status; repository?: string; createdAt?: string; consentAt?: string; handle: string; initials: string; color: string; time: string };

/** Render only web links. The server never fetches a submitted URL. */
export function safeProjectUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length > 2048) return undefined;
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : undefined; }
  catch { return undefined; }
}
export const submissionSchema = z.object({
  name: z.string().trim().min(2, "Indique ton nom (2 caractères minimum).").max(100),
  location: z.string().trim().min(2, "Indique ta ville et ton pays.").max(100),
  focus: z.string().trim().min(2, "Indique le nom du projet.").max(150),
  bio: z.string().trim().min(20, "Décris ton projet en au moins 20 caractères.").max(5000),
  repository: z.string().trim().max(2048).refine(value => Boolean(safeProjectUrl(value)), "Ajoute un lien http:// ou https:// valide."),
  consent: z.literal(true, { error: "Ton accord est nécessaire pour présenter le projet en live." }),
  website: z.string().max(0, "Envoi refusé.").optional(),
}).strict();
export const statusSchema = z.object({ status: z.enum(statuses) }).strict();

/** Ignore tracking parameters and fragments when detecting repeat submissions. */
export function canonicalProjectUrl(value: string): string {
  const url = new URL(value);
  url.hash = "";
  for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
  url.searchParams.sort();
  return `${url.host.toLowerCase().replace(/^www\./, "")}${url.pathname.replace(/\/+$/, "")}${url.search}`;
}
export function projectUrl(application: Application): string | undefined {
  return safeProjectUrl(application.repository ?? application.bio.match(/— Dépôt : (https?:\/\/\S+)\s*$/)?.[1]);
}
export function isApplication(value: unknown): value is Application {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return Number.isSafeInteger(item.id) && ["name", "location", "focus", "bio", "status", "handle", "initials", "color", "time"].every(key => typeof item[key] === "string");
}
