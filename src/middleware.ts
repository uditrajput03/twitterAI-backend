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
            status: "Unauthorized test"
        }, 401)
    }
})
export const teleLogger = createMiddleware(async (c, next) => {
    let e:any = await next();
    let jwtData = e.get('jwtPayload')
    try {
        let data = {
            chat_id: c.env.CHAT_ID,
            text: `Action: ${c.req.path}
Email: ${jwtData.email}`
        }
        c.executionCtx.waitUntil(
            fetch(`https://api.telegram.org/bot${c.env.BOT_TOKEN}/sendMessage`, {
                method: "post",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data)
            })
        )
    } catch (error) {
        console.log("Something went wrong in teleLogger")
    }
})