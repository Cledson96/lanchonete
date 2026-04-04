import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function getRuntimeDatabaseUrl() {
  if (process.env.NODE_ENV === "production") {
    return process.env.DATABASE_REMOTE_URL || process.env.DATABASE_URL;
  }

  return process.env.DATABASE_URL || process.env.DATABASE_REMOTE_URL;
}

function createPrismaClient() {
  const connectionString = getRuntimeDatabaseUrl();

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL ou DATABASE_REMOTE_URL precisa estar configurado para o Prisma.",
    );
  }

  const adapter = new PrismaPg({
    connectionString,
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
