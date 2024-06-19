import { createMiddleware } from 'hono/factory'
import { PrismaClient } from '@prisma/client'
import { Pool } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { verify } from 'hono/jwt'

export const getPrisma = createMiddleware(async (c, next) => {
    const connectionString = c.env.DATABASE_URL
    const pool = new Pool({ connectionString })
    const adapter = new PrismaNeon(pool)
    const prisma = new PrismaClient({ adapter })
    c.set('prisma', prisma)
    await next()
})
export const authCheck = createMiddleware(async (c, next) => {
    let token = c.req.header('authorization')
    if (token != null) {
        try {
            let jwt = await verify(token, c.env.JWT_SECRET)
            c.set('jwtPayload', jwt)
            await next()
        } catch (error) {
            return c.json({
                status: "Invalid Authentication"
            }, 401)
        }
    }
    else {
        return c.json({
            status: "Unauthorized"
        }, 401)
    }
})