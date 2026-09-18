import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { cookieName, verifySession } from "../../../../lib/auth";

const dataPath = path.join(process.cwd(), "data", "applications.json");

export const PATCH = async (request: Request, context: { params: Promise<{ id: string }> }) => {
  if (!verifySession(request.headers.get("cookie")?.match(new RegExp(`${cookieName}=([^;]+)`))?.[1])) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const { id } = await context.params;
  const patch = await request.json() as { status?: string };
  const applications = JSON.parse(await fs.readFile(dataPath, "utf8")) as Array<{ id: number; status: string }>;
  const index = applications.findIndex((application) => application.id === Number(id));
  if (index < 0) return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
  applications[index] = { ...applications[index], ...patch };
  await fs.writeFile(dataPath, JSON.stringify(applications, null, 2), "utf8");
  return NextResponse.json(applications[index]);
};
