import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = `${process.env.DATABASE_URL}`;
console.log(process.env.DATABASE_URL, "connection string");
const adapter = new PrismaPg({ connectionString });

const globalForPrisma = globalThis as unknown as {
	prismaClient: PrismaClient | undefined;
};

export const prismaClient =
	globalForPrisma.prismaClient ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prismaClient = prismaClient;
}
