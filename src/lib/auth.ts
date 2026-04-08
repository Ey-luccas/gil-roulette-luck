import { createHash, timingSafeEqual } from "node:crypto";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { ADMIN_COOKIE_NAME, createAdminSessionToken, parseAdminSessionToken, SESSION_TTL_SECONDS } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import type { AdminSession } from "@/types/admin";

type AdminIdentity = {
  id: string;
  username: string;
};

function hashPassword(password: string) {
  return createHash("sha256").update(password).digest("hex");
}

function safeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function verifyAdminCredentials({
  username,
  password,
}: {
  username: string;
  password: string;
}) {
  const normalizedUsername = username.trim().toLowerCase();

  if (!normalizedUsername || !password) {
    return null;
  }

  const admin = await prisma.adminUser.findUnique({
    where: { username: normalizedUsername },
    select: {
      id: true,
      username: true,
      passwordHash: true,
    },
  });

  if (!admin) {
    return null;
  }

  const providedHash = hashPassword(password);
  if (!safeEqualHex(providedHash, admin.passwordHash)) {
    return null;
  }

  return {
    id: admin.id,
    username: admin.username,
  };
}

export async function setAdminSession(identity: AdminIdentity) {
  const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
  const token = createAdminSessionToken({
    adminUserId: identity.id,
    username: identity.username,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  const payload = parseAdminSessionToken(token);

  if (!payload) {
    return null;
  }

  return {
    authenticated: true,
    adminUserId: payload.adminUserId,
    username: payload.username,
    expiresAt: new Date(payload.expiresAt).toISOString(),
  };
}

export async function isAdminLoggedIn() {
  const session = await getAdminSession();
  return Boolean(session?.authenticated);
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session?.authenticated) {
    redirect("/admin/login");
  }

  return session;
}
