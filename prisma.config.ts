import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

const datasourceUrl = process.env.DATABASE_URL && process.env.DIRECT_DATABASE_URL
	? env('DIRECT_DATABASE_URL')
	: env('DATABASE_URL')

export default defineConfig({
	schema: 'prisma/schema.prisma',
	migrations: {
		path: 'prisma/migrations',
	},
	datasource: {
		url: datasourceUrl,
	},
})
