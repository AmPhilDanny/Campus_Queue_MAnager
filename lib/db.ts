/**
 * Prisma Client Singleton
 * 
 * Ensures a single instance of PrismaClient is used across the application
 * during development and production to prevent memory leaks and connection 
 * pool exhaustion in Next.js Hot Reloading.
 */

import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prisma ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
