import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cookieNames } from "@/lib/auth/cookies";
import { config } from "@/lib/config";
import { blacklistToken, isTokenBlacklisted } from "./token-blacklist";

function generateJti(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type AdminSessionPayload = {
  sub: string;
  kind: "admin";
  role: "admin";
  email: string;
};

type CustomerSessionPayload = {
  sub: string;
  kind: "customer";
  phone: string;
  customerProfileId: string;
  verifiedAt: string;
};

export type AppSessionPayload = AdminSessionPayload | CustomerSessionPayload;

const encoder = new TextEncoder();

function getSecret() {
  return encoder.encode(config.authSecret);
}

async function signSession(
  payload: AppSessionPayload,
  expiresIn: string,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setJti(generateJti())
    .setExpirationTime(expiresIn)
    .sign(getSecret());
}

async function verifySession(token: string) {
  const result = await jwtVerify<AppSessionPayload>(token, getSecret());
  if (result.payload.jti && isTokenBlacklisted(result.payload.jti)) {
    throw new Error("Token invalidado.");
  }
  return result.payload;
}

export async function setAdminSession(payload: AdminSessionPayload) {
  const token = await signSession(payload, "7d");
  const store = await cookies();

  store.set(cookieNames.admin, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function setCustomerSession(payload: CustomerSessionPayload) {
  const token = await signSession(payload, "30m");
  const store = await cookies();

  store.set(cookieNames.customer, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 30,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  const token = store.get(cookieNames.admin)?.value;
  if (token) {
    try {
      const payload = await jwtVerify<{ jti?: string }>(token, getSecret());
      if (payload.payload.jti) {
        blacklistToken(payload.payload.jti);
      }
    } catch {
      // Token already invalid, nothing to blacklist
    }
  }
  store.delete(cookieNames.admin);
}

export async function clearCustomerSession() {
  const store = await cookies();
  const token = store.get(cookieNames.customer)?.value;
  if (token) {
    try {
      const payload = await jwtVerify<{ jti?: string }>(token, getSecret());
      if (payload.payload.jti) {
        blacklistToken(payload.payload.jti);
      }
    } catch {
      // Token already invalid, nothing to blacklist
    }
  }
  store.delete(cookieNames.customer);
}

export async function getAdminSession() {
  const store = await cookies();
  const token = store.get(cookieNames.admin)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifySession(token);
    return payload.kind === "admin" ? payload : null;
  } catch {
    return null;
  }
}

export async function getCustomerSession() {
  const store = await cookies();
  const token = store.get(cookieNames.customer)?.value;

  if (!token) {
    return null;
  }

  try {
    const payload = await verifySession(token);
    return payload.kind === "customer" ? payload : null;
  } catch {
    return null;
  }
}
