import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { loginSchema, registerSchema } from "@smart-home/shared";
import { nowMs } from "@smart-home/utils";
import { db } from "../db/client.js";
import { users } from "../db/schema.js";
import { clearSessionCookie, readSessionToken, writeSessionCookie } from "../lib/cookies.js";
import { id } from "../lib/ids.js";
import { hashPassword, needsRehash, verifyPassword } from "../lib/password.js";
import { requireUser, type AuthedEnv } from "../middleware/auth.js";
import { services } from "../services.js";

export const authRoutes = new Hono();

authRoutes.post("/register", async (c) => {
  const parsed = registerSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
  }

  const email = parsed.data.email.toLowerCase();
  const [existing] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return c.json({ error: "That email is already registered" }, 409);
  }

  const user = {
    id: id(),
    email,
    name: parsed.data.name,
    passwordHash: await hashPassword(parsed.data.password),
    createdAt: nowMs(),
  };
  await db.insert(users).values(user);

  const session = await services.sessions.createUser({
    userId: user.id,
    email: user.email,
    name: user.name,
    createdAt: nowMs(),
  });
  writeSessionCookie(c, session.id);

  return c.json(
    {
      token: session.id,
      user: { id: user.id, email: user.email, name: user.name },
    },
    201,
  );
});

authRoutes.post("/login", async (c) => {
  const parsed = loginSchema.safeParse(await c.req.json());
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1);

  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return c.json({ error: "Email or password is incorrect" }, 401);
  }

  if (needsRehash(user.passwordHash)) {
    await db
      .update(users)
      .set({ passwordHash: await hashPassword(parsed.data.password) })
      .where(eq(users.id, user.id));
  }

  const session = await services.sessions.createUser({
    userId: user.id,
    email: user.email,
    name: user.name,
    createdAt: nowMs(),
  });
  writeSessionCookie(c, session.id);

  return c.json({
    token: session.id,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

authRoutes.post("/logout", async (c) => {
  const token = readSessionToken(c);
  if (token) await services.sessions.deleteUser(token);
  clearSessionCookie(c);
  return c.json({ ok: true });
});

export const meRoutes = new Hono<AuthedEnv>();
meRoutes.use("*", requireUser);
meRoutes.get("/", (c) =>
  c.json({
    id: c.get("userId"),
    email: c.get("userEmail"),
    name: c.get("userName"),
  }),
);
