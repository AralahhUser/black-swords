import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { getAdminUser, getSql } from "./db.js";

const cookieName = "bs_admin_session";
const sessionLifetime = 60 * 60 * 8;

const getSessionSecret = () => {
  if (!process.env.ADMIN_SESSION_SECRET) {
    const error = new Error("ADMIN_SESSION_SECRET is not configured");
    error.code = "SESSION_SECRET_NOT_CONFIGURED";
    throw error;
  }
  return process.env.ADMIN_SESSION_SECRET;
};

const encode = (value) => Buffer.from(value).toString("base64url");
const decode = (value) => Buffer.from(value, "base64url").toString("utf8");

const sign = (value) => createHmac("sha256", getSessionSecret()).update(value).digest("base64url");

const readCookies = (req) => Object.fromEntries(
  String(req.headers.cookie || "")
    .split(";")
    .map((part) => part.trim().split("="))
    .filter(([key, value]) => key && value)
    .map(([key, ...value]) => [key, decodeURIComponent(value.join("="))]),
);

export const getSessionAdminId = (req) => {
  const token = readCookies(req)[cookieName];
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;
  try {
    const data = JSON.parse(decode(payload));
    return data.exp > Date.now() ? data.id : null;
  } catch {
    return null;
  }
};

export const requireAdmin = async (req) => {
  const id = getSessionAdminId(req);
  if (!id) return null;
  const admin = await getAdminUser();
  return admin?.id === id ? admin : null;
};

export const hashPassword = (password) => {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
};

export const verifyPassword = (password, stored) => {
  const [salt, expected] = String(stored || "").split(":");
  if (!salt || !expected) return false;
  const actual = scryptSync(password, salt, 64);
  const expectedBuffer = Buffer.from(expected, "hex");
  return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer);
};

export const createSessionCookie = (req, id) => {
  const payload = encode(JSON.stringify({ id, exp: Date.now() + sessionLifetime * 1000 }));
  const secure = req.headers["x-forwarded-proto"] === "https" ? "; Secure" : "";
  return `${cookieName}=${encodeURIComponent(`${payload}.${sign(payload)}`)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionLifetime}${secure}`;
};

export const createAdminUser = async (id, password) => {
  const sql = getSql();
  await sql`insert into bs_admin_users (id, password_hash) values (${id}, ${hashPassword(password)})`;
};
