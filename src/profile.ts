import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { getPrisma, teleLogger } from './middleware'
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

profile.get('/', async (c: any) => {
    const prisma = c.var.prisma
    let jwtData = c.get('jwtPayload')
    try {
        const profiles = await prisma.profile.findMany({
            where: {
                userId: jwtData.id
            },
            select: {
                name: true,
                description: true,
                id: true,
            }
        })
        return c.json(profiles)
    } catch (error) {
        return c.json({
            status: "Somthing went wrong"
        }, 400)
    }
})
profile.use('/', teleLogger)
profile.post('/', async (c) => {
    const body = await c.req.json()
    const prisma = c.var.prisma
    let jwtData = c.get('jwtPayload')
    try {
        const profile = await prisma.profile.create({
            data: {
                name: body.name,
                description: body.description,
                userId: jwtData.id
            }
        })
        return c.json({ profile })
    } catch (error) {
        return c.json({
            status: "Somthing went wrong"
        }, 400)
    }
})
profile.delete('/', async (c) => {
    const body = await c.req.json()
    const prisma = c.var.prisma
    let jwtData = c.get('jwtPayload')
    try {
        const profile = await prisma.profile.delete({
            where: {
                id: body.id,
                userId: jwtData.id
            }
        })
        return c.json(
            {
                status: "success",
                id: profile.id
            })
    } catch (error) {
        return c.json({
            status: "Somthing went wrong"
        }, 400)
    }
}
)
profile.put('/', async (c) => {
    const body = await c.req.json()
    console.log(body);
    const prisma = c.var.prisma
    let jwtData = c.get('jwtPayload')
    try {
        const profile = await prisma.profile.update({
            where: {
                id: body.id,
                userId: jwtData.id
            },
            data: {
                name: body.name,
                description: body.description
            }
        })
        return c.json(
            {
                status: "success",
                id: profile.id
            })
    } catch (error) {
        console.log(error);
        
        return c.json({
            status: "Somthing went wrong"
        }, 400)
    }
})