import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE_NAME = "sacola_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
const SESSION_VERSION = "v1";

export type SessionPayload = {
  version: string;
  adminUserId: string;
  username: string;
  expiresAt: number;
};

type CreateSessionInput = {
  adminUserId: string;
  username: string;
  expiresAt: number;
};

function getSessionSecret() {
  return process.env.ADMIN_SESSION_SECRET ?? process.env.AUTH_SECRET ?? "dev-admin-secret-change-me";
}

function signValue(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function safeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAdminSessionToken(input: CreateSessionInput) {
  const serializedPayload = [
    SESSION_VERSION,
    input.adminUserId,
    input.username,
    String(input.expiresAt),
  ].join(":");

  const signature = signValue(serializedPayload);
  const token = `${serializedPayload}:${signature}`;

  return Buffer.from(token, "utf8").toString("base64url");
}

export function parseAdminSessionToken(token?: string): SessionPayload | null {
  if (!token) return null;

  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [version, adminUserId, username, expiresAtRaw, signature] = decoded.split(":");

    if (!version || !adminUserId || !username || !expiresAtRaw || !signature) {
      return null;
    }

    const signedValue = [version, adminUserId, username, expiresAtRaw].join(":");
    const expectedSignature = signValue(signedValue);
    if (!safeEqualHex(signature, expectedSignature)) {
      return null;
    }

    const expiresAt = Number(expiresAtRaw);
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return null;
    }

    if (version !== SESSION_VERSION) {
      return null;
    }

    return {
      version,
      adminUserId,
      username,
      expiresAt,
    };
  } catch {
    return null;
  }
}
