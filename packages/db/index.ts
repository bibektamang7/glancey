import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
	prismaClient: PrismaClient | undefined;
};

export const prismaClient =
	globalForPrisma.prismaClient ?? new PrismaClient({ log: ["query"] });

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prismaClient = prismaClient;
}
