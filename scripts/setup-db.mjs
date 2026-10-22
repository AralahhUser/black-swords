import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL. Configúrala antes de ejecutar npm run db:setup.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);
const schema = await readFile(new URL("../schema.sql", import.meta.url), "utf8");
await sql.query(schema);
console.log("Black Swords database ready.");
