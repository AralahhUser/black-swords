import { createAdminUser, createSessionCookie, verifyPassword } from "../_lib/auth.js";
import { ensureSchema, getAdminUser } from "../_lib/db.js";
import { json, methodNotAllowed, readJson } from "../_lib/http.js";

export default async function handler(req, res) {
  try {
    await ensureSchema();
    const admin = await getAdminUser();
    if (req.method === "GET") return json(res, 200, { configured: Boolean(admin) });
    if (req.method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);

    const body = await readJson(req);
    if (body.action === "logout") {
      return json(res, 200, { ok: true }, { "Set-Cookie": "bs_admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0" });
    }

    const id = String(body.id || "").trim();
    const password = String(body.password || "");
    if (id.length < 3 || password.length < 8) {
      return json(res, 400, { error: "El ID debe tener 3 caracteres y la contraseña 8 como mínimo." });
    }

    if (!admin && body.action === "setup") {
      await createAdminUser(id, password);
      return json(res, 201, { ok: true }, { "Set-Cookie": createSessionCookie(req, id) });
    }

    if (!admin || admin.id !== id || !verifyPassword(password, admin.password_hash)) {
      return json(res, 401, { error: "ID o contraseña incorrectos." });
    }
    return json(res, 200, { ok: true }, { "Set-Cookie": createSessionCookie(req, admin.id) });
  } catch (error) {
    console.error("admin-auth", error);
    return json(res, error.code === "DATABASE_NOT_CONFIGURED" || error.code === "SESSION_SECRET_NOT_CONFIGURED" ? 503 : 500, {
      error: "El servicio de administración no está configurado todavía.",
    });
  }
}
