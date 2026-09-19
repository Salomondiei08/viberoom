import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth";
import { Application, canonicalProjectUrl, isApplication, projectUrl, submissionSchema } from "../../../lib/applications";
import { changeStore, readStore } from "../../../lib/storage";
import { apiError, rateLimit, readJson, requireSameOrigin } from "../../../lib/http";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const applications = await readStore<Application[]>("applications.json", []);
    if (!Array.isArray(applications) || !applications.every(isApplication)) throw new Error("Invalid store");
    return NextResponse.json(applications, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return apiError(error); }
}
export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    await rateLimit(request, "submit", 10, 15 * 60 * 1000);
    const body = submissionSchema.parse(await readJson(request));
    const result = await changeStore<Application[], { duplicate: boolean }>("applications.json", [], applications => {
      if (!Array.isArray(applications) || !applications.every(isApplication)) throw new Error("Invalid store");
      const key = canonicalProjectUrl(body.repository);
      if (applications.some(item => { const url = projectUrl(item); return url && canonicalProjectUrl(url) === key; })) return { duplicate: true };
      const now = new Date().toISOString();
      applications.unshift({
        name: body.name, location: body.location, focus: body.focus, bio: body.bio, repository: body.repository,
        id: applications.reduce((id, item) => Math.max(id, item.id + 1), Date.now()),
        handle: `@${body.name.toLowerCase().replace(/\s+/g, ".")}`,
        status: "Nouveau", color: "#87456a", initials: body.name.split(/\s+/).map(word => word[0]).join("").slice(0, 2).toUpperCase(),
        time: "à l’instant", createdAt: now, consentAt: now,
      });
      return { duplicate: false };
    });
    // Do not expose a previous submitter's personal information on duplicate links.
    return NextResponse.json({ ok: true, ...result }, { status: result.duplicate ? 200 : 201 });
  } catch (error) { return apiError(error); }
}
