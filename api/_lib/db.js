import { neon } from "@neondatabase/serverless";
import { copyDefaultConfig, normalizeConfig } from "./config.js";

let schemaPromise;

export const getSql = () => {
  if (!process.env.DATABASE_URL) {
    const error = new Error("DATABASE_URL is not configured");
    error.code = "DATABASE_NOT_CONFIGURED";
    throw error;
  }
  return neon(process.env.DATABASE_URL);
};

export const ensureSchema = async () => {
  if (!schemaPromise) {
    const sql = getSql();
    schemaPromise = (async () => {
      await sql`create table if not exists bs_admin_users (
        id text primary key,
        password_hash text not null,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      )`;
      await sql`create table if not exists bs_store_config (
        id integer primary key default 1 check (id = 1),
        published jsonb not null,
        draft jsonb,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        published_at timestamptz not null default now()
      )`;
      await sql`
        insert into bs_store_config (id, published)
        values (1, ${JSON.stringify(copyDefaultConfig())}::jsonb)
        on conflict (id) do nothing
      `;
    })().catch((error) => {
      schemaPromise = undefined;
      throw error;
    });
  }
  return schemaPromise;
};

export const getStoreConfig = async () => {
  await ensureSchema();
  const sql = getSql();
  const [row] = await sql`select published, draft from bs_store_config where id = 1`;
  return {
    published: normalizeConfig(row?.published || copyDefaultConfig()),
    draft: row?.draft ? normalizeConfig(row.draft) : null,
  };
};

export const getAdminUser = async () => {
  await ensureSchema();
  const sql = getSql();
  const [row] = await sql`select id, password_hash from bs_admin_users order by created_at asc limit 1`;
  return row || null;
};

export const saveDraft = async (config) => {
  await ensureSchema();
  const sql = getSql();
  await sql`
    update bs_store_config
    set draft = ${JSON.stringify(normalizeConfig(config))}::jsonb,
        updated_at = now()
    where id = 1
  `;
};

export const publishConfig = async (config) => {
  await ensureSchema();
  const sql = getSql();
  await sql`
    update bs_store_config
    set published = ${JSON.stringify(normalizeConfig(config))}::jsonb,
        draft = null,
        published_at = now(),
        updated_at = now()
    where id = 1
  `;
};
