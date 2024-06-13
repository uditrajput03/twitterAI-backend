import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { getPrisma } from './middleware'
import { PrismaClient } from '@prisma/client/extension'

type Bindings = {
    GROQ_KEY: string
    JWT_SECRET: string
}
type Variables = {
    prisma: PrismaClient
}

export const profile = new Hono<{ Bindings: Bindings, Variables: Variables }>()
profile.use(logger())
profile.use(cors())
profile.use(getPrisma)

profile.post('/create', async (c) => {
    const body = await c.req.json()
    const prisma = c.var.prisma
    let jwtData = c.get('jwtPayload')
    const profile = await prisma.profile.create({
        data: {
            name: body.name,
            description: body.description,
            userId: jwtData.id
        }
    })
    return c.json({ profile })
})