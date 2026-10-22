import { getStoreConfig, publishConfig, saveDraft } from "../_lib/db.js";
import { requireAdmin } from "../_lib/auth.js";
import { json, methodNotAllowed, readJson } from "../_lib/http.js";

export default async function handler(req, res) {
  try {
    const admin = await requireAdmin(req);
    if (!admin) return json(res, 401, { error: "Sesión de administrador requerida." });
    const stored = await getStoreConfig();
    if (req.method === "GET") return json(res, 200, stored.draft || stored.published);
    if (req.method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);

    const body = await readJson(req);
    if (!body.config || !["draft", "publish"].includes(body.mode)) {
      return json(res, 400, { error: "Solicitud de configuración inválida." });
    }
    if (body.mode === "publish") await publishConfig(body.config);
    else await saveDraft(body.config);
    const updated = await getStoreConfig();
    return json(res, 200, {
      ok: true,
      config: body.mode === "publish" ? updated.published : updated.draft,
      mode: body.mode,
    });
  } catch (error) {
    console.error("admin-config", error);
    return json(res, error.code === "DATABASE_NOT_CONFIGURED" || error.code === "SESSION_SECRET_NOT_CONFIGURED" ? 503 : 500, {
      error: "No se pudo guardar la configuración.",
    });
  }
}
