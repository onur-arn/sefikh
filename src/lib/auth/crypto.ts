import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function sign(value: string) {
  const mac = createHmac("sha256", env.authSecret).update(value).digest("base64url");
  return `${value}.${mac}`;
}

export function unsign(signed: string | undefined | null): string | null {
  if (!signed) return null;
  const i = signed.lastIndexOf(".");
  if (i < 1) return null;
  const value = signed.slice(0, i);
  const expected = Buffer.from(sign(value));
  const actual = Buffer.from(signed);
  return expected.length === actual.length && timingSafeEqual(expected, actual) ? value : null;
}
