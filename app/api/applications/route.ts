import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { cookieName, verifySession } from "../../../lib/auth";

const dataPath = path.join(process.cwd(), "data", "applications.json");

type Application = Record<string, unknown> & { id: number };

const readApplications = async (): Promise<Application[]> => {
  try {
    return JSON.parse(await fs.readFile(dataPath, "utf8")) as Application[];
  } catch {
    await fs.mkdir(path.dirname(dataPath), { recursive: true });
    await fs.writeFile(dataPath, "[]", "utf8");
    return [];
  }
};

const writeApplications = async (applications: Application[]) => {
  await fs.mkdir(path.dirname(dataPath), { recursive: true });
  await fs.writeFile(dataPath, JSON.stringify(applications, null, 2), "utf8");
};

export const GET = async (request: Request) => { if (!verifySession(request.headers.get("cookie")?.match(new RegExp(`${cookieName}=([^;]+)`))?.[1])) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 }); return NextResponse.json(await readApplications()); };

export const POST = async (request: Request) => {
  const body = await request.json() as Omit<Application, "id">;
  if (!body.name || !body.location || !body.focus || !body.bio) {
    return NextResponse.json({ error: "Les champs obligatoires sont incomplets." }, { status: 400 });
  }
  const applications = await readApplications();
  const name = String(body.name);
  const application: Application = {
    ...body,
    id: Date.now(),
    handle: `@${name.toLowerCase().trim().replace(/\s+/g, ".")}`,
    status: "Nouveau",
    color: "#c55a91",
    initials: name.split(/\s+/).map((word) => word[0]).join("").slice(0, 2).toUpperCase(),
    time: "à l’instant",
  };
  await writeApplications([application, ...applications]);
  return NextResponse.json(application, { status: 201 });
};
