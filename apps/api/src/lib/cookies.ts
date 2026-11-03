import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { USER_SESSION_TTL_SEC } from "@smart-home/shared";
import { env } from "../env.js";

export const SESSION_COOKIE = "auzy_session";

export function readSessionToken(c: Context) {
  const cookie = getCookie(c, SESSION_COOKIE);
  if (cookie) return cookie;
  const header = c.req.header("authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

export function writeSessionCookie(c: Context, token: string) {
  setCookie(c, SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: USER_SESSION_TTL_SEC,
    secure: env.cookieSecure,
  });
}

export function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
}
