import type { PrismaClient } from '@prisma/client'

// @ts-expect-error تایپ اسکریپت ندارد
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

const { PrismaClient: RealPrismaClient } = require('@prisma/client')

// expose a singleton
export const db: PrismaClient = new RealPrismaClient()
