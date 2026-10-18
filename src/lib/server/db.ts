import { env } from '$env/dynamic/private'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from './generated/prisma/client'

const globalForPrisma = globalThis as unknown as { db?: PrismaClient }

let client: PrismaClient | undefined

function getClient() {
	if (client) return client
	if (globalForPrisma.db) {
		client = globalForPrisma.db
		return client
	}

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

	client = new PrismaClient({ adapter })
	return client
}

// Keep importing server modules safe during static/CSR builds. Prisma is created only when a
// request actually touches a database delegate, and is reused during development hot reloads.
export const db = new Proxy({} as PrismaClient, {
	get(_target, property) {
		const prisma = getClient()
		const value = Reflect.get(prisma, property, prisma)
		return typeof value === 'function' ? value.bind(prisma) : value
	},
})

if (import.meta.env.DEV) {
	globalForPrisma.db = getClient()
}
