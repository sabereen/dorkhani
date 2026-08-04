import { env } from '$env/dynamic/private'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from './generated/prisma/client'

const databaseUrl = env.DATABASE_URL

if (!databaseUrl) {
	throw new Error('DATABASE_URL must be defined to initialize Prisma Client.')
}

const connectionUrl = new URL(databaseUrl)
const adapter = new PrismaMariaDb({
	host: connectionUrl.hostname,
	port: connectionUrl.port ? Number(connectionUrl.port) : 3306,
	user: decodeURIComponent(connectionUrl.username),
	password: decodeURIComponent(connectionUrl.password),
	database: decodeURIComponent(connectionUrl.pathname.slice(1)),
})

const globalForPrisma = globalThis as unknown as { db?: PrismaClient }

// Reuse the client during development hot reloads and keep one client per Node.js process.
export const db = globalForPrisma.db ?? new PrismaClient({ adapter })

if (import.meta.env.DEV) {
	globalForPrisma.db = db
}
