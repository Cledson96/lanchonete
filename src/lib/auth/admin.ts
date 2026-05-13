import bcrypt from "bcryptjs";
import { ApiError } from "@/lib/api/error";
import { prisma } from "@/lib/prisma";
import { setAdminSession, getAdminSession } from "@/lib/auth/session";

export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    throw new ApiError(401, "Admin nao autenticado.");
  }

  return session;
}

export async function loginAdmin(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || user.role !== "admin" || !user.passwordHash) {
    throw new ApiError(401, "Credenciais invalidas.");
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, "Credenciais invalidas.");
  }

  await setAdminSession({
    sub: user.id,
    kind: "admin",
    role: "admin",
    email: user.email,
  });

  return {
    id: user.id,
    email: user.email,
    role: user.role,
  };
}
