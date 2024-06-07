import { createMiddleware } from 'hono/factory'
import { PrismaClient } from '@prisma/client'
import { Pool } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

export const getPrisma = createMiddleware(async (c, next) => {
    const connectionString = c.env.DATABASE_URL
    const pool = new Pool({ connectionString })
    const adapter = new PrismaNeon(pool)
    const prisma = new PrismaClient({ adapter })
    c.set('prisma', prisma)
    await next()
})