import { NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth";
import { Application, isApplication, statusSchema } from "../../../../lib/applications";
import { changeStore } from "../../../../lib/storage";
import { apiError, HttpError, rateLimit, readJson, requireSameOrigin } from "../../../../lib/http";
export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    await requireAdmin(request);
    await rateLimit(request, "status", 120, 60 * 1000);
    const { id } = await context.params;
    if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id))) throw new HttpError(400, "Identifiant invalide.");
    const { status } = statusSchema.parse(await readJson(request, 1024));
    const application = await changeStore<Application[], Application>("applications.json", [], applications => {
      if (!Array.isArray(applications) || !applications.every(isApplication)) throw new Error("Invalid store");
      const item = applications.find(application => application.id === Number(id));
      if (!item) throw new HttpError(404, "Projet introuvable.");
      item.status = status;
      return item;
    });
    return NextResponse.json(application);
  } catch (error) { return apiError(error); }
}
