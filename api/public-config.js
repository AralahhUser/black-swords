import { getStoreConfig } from "./_lib/db.js";
import { json, methodNotAllowed } from "./_lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);
  try {
    const { published } = await getStoreConfig();
    return json(res, 200, published);
  } catch (error) {
    console.error("public-config", error);
    return json(res, error.code === "DATABASE_NOT_CONFIGURED" ? 503 : 500, {
      error: "La configuración pública no está disponible todavía.",
    });
  }
}
