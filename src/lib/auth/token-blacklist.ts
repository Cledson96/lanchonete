import { SimpleCache } from "@/lib/simple-cache";

const tokenBlacklist = new SimpleCache<true>(60 * 60 * 24 * 7 * 1000);

export function blacklistToken(jti: string): void {
  tokenBlacklist.set(jti, true);
}

export function isTokenBlacklisted(jti: string): boolean {
  return tokenBlacklist.get(jti) === true;
}
