import { PrismaClient } from '@prisma/client/extension'
import { PrismaClient as pc } from '@prisma/client'
import { decode, sign, verify } from 'hono/jwt'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authCheck, getPrisma, teleLogger } from './middleware'
import { profile } from './profile'
import { Pool } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'

type Bindings = {
  GROQ_KEY: string
  JWT_SECRET: string
  DATABASE_URL: string
}
type Variables = {
  prisma: PrismaClient
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()
app.use(logger())
app.use(cors())
app.use(getPrisma)
app.use('/auth/*', authCheck)
app.route('/auth/profile/*', profile)

app.get('/', async (c: any) => {
  return c.text(`Hello from twitterAI prod`)
})
app.use('/register', teleLogger )
app.post('/register', async (c) => {
  const body: any = await c.req.json()
  const prisma = c.var.prisma
  console.log(body);
  try {
    let out = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: body.password
      }
    })
    const jwt = await sign({ email: out.email, id: out.id }, c.env.JWT_SECRET)
    c.set('jwtPayload', { email: out.email, id: out.id })
    return c.json({
      status: "Account Created successfully",
      id: out.id,
      token: jwt
    })
  } catch (error: any) {
    if (error.code = "P2002") {
      return c.json({
        status: "Account Already exist"
      })
    }
    console.log(error);
    return c.json({
      status: "Somthing went wrong"
    }, 400)
  }
})

app.post('/login', async (c) => {
  const body: any = await c.req.json()
  const prisma = c.var.prisma
  try {
    let out = await prisma.user.findUnique({
      where: {
        email: body.email
      }
    })
    if (out != null) {
      if (out.password == body.password) {
        const jwt = await sign({ email: out.email, id: out.id }, c.env.JWT_SECRET)
        return c.json({
          status: "Logged In",
          id: out.id,
          token: jwt
        })
      }
      else {
        return c.json({
          status: "Invalid password",
        }, 400)

      }
    }
    return c.json({
      status: "User not exists"
    })
  }
  catch (error) {
    return c.json({
      status: "Somthing went wrong"
    }, 400)
  }
})

app.get('/auth', async (c) => {
  let jwtData = c.get('jwtPayload')
  return c.json(jwtData)
})

app.get('/auth/dashboard', async (c) => {
  let jwtData = c.get('jwtPayload')
  const prisma = c.var.prisma
  try {
    let profile = await prisma.user.findUnique({
      where: {
        id: jwtData.id
      },
      select: {
        name: true,
        email: true,
        id: true,
        verified: true,
        remaining_quota: true,
        daily_quota: true
      }
    })
    return c.json(profile)
  } catch (error) {
    return c.json({
      status: "Somthing went wrong"
    }, 400)
  }
}
)
app.get('/auth/quota', async (c) => {
  let jwtData = c.get('jwtPayload')
  const prisma = c.var.prisma
  try {
    let quota = await prisma.user.findUnique({
      where: {
        id: jwtData.id
      },
      select: {
        id: true,
        remaining_quota: true,
        daily_quota: true
      }
    })
    return c.json(quota)
  } catch (error) {
    return c.json({
      status: "Somthing went wrong"
    }, 400)
  }
})
app.use('/auth/generate', teleLogger)
app.use('/auth/generate', async (c, next) => {
  let jwtData = c.get('jwtPayload')
  const prisma = c.var.prisma
  try {
    let quota: any = await prisma.user.findUnique({
      where: {
        id: jwtData.id
      },
      select: {
        remaining_quota: true
      }
    })
    c.set("quota", quota)
    if (quota.remaining_quota <= 0) {
      return c.json({
        status: "Limit Exceeded"
      }, 400)
    }
    else {
      await next()
      try {
        await prisma.user.update({
          where: {
            id: jwtData.id
          },
          data: {
            remaining_quota: {
              decrement: 1
            }
          }
        })
      } catch (error) {
        console.log(error);
        return c.json({
          status: "Somthing went wrong with quota"
        }, 400)
      }
    }
  } catch (error) {
    console.log(error);
    return c.json({
      status: "Somthing went wrong with quota"
    }, 400)
  }
})
app.post('/auth/generate', async (c) => {
  let reqBody = await c.req.json()
  let jwtData = c.get('jwtPayload')
  let remaining_quota = c.get('quota').remaining_quota - 1
  const prisma = c.var.prisma
  try {
    const profile = await prisma.profile.findUnique({
      where: {
        userId: jwtData.id,
        id: reqBody.profile
      }
    })
    let groq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.GROQ_KEY}`
      },
      body: JSON.stringify({
        "messages": [
          {
            "role": "system",
            "content": "You have give a description which can have details about the product or of the job or personal detail , and you have given a comment you need to reply to it as a human to promote the description in a organic and smooth way which promote the description randomly into the reply.\nReplys should be short, easy to understand.\nreply must not contain any external link.\nreply must not contains any hashtag \nReply must not be in double qoutes"
          },
          {
            "role": "user",
            "content": `Description - ${profile.description}`
          },
          {
            "role": "user",
            "content": `Comment - \"${reqBody.tweet}\"`
          }
        ], "model": "llama3-70b-8192",
        "temperature": 1,
        "max_tokens": 1024,
        "top_p": 1,
        "stream": false,
      })
    })
    let groqBody: any = await groq.json()
    return c.json(
      {
        "response": groqBody.choices[0].message.content,
        "profile": profile.name,
        "remaining_quota": remaining_quota
      }
    )
  } catch (error) {
    console.log(error);

    return c.json({
      status: "Somthing went wrong"
    }, 400)
  }
})


app.get('/test', async (c) => {
  try {
    let groq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.GROQ_KEY}`
      },
      body: JSON.stringify({
        "messages": [
          {
            "role": "system",
            "content": "You have give a description which can have details about the product or of the job or personal detail , and you have given a comment you need to reply to it as a human to promote the description in a organic and smooth way which promote the description randomly into the reply.\nReplys should be short, easy to understand.\nreply must not contain any external link.\nreply must not contains any hashtag"
          },
          {
            "role": "user",
            "content": "Description - ScreenCat - a extension to take full page screenshot"
          },
          {
            "role": "user",
            "content": "Comment - \"I need to take full screenshot my website content\""
          }
        ], "model": "llama3-70b-8192",
        "temperature": 1,
        "max_tokens": 1024,
        "top_p": 1,
        "stream": false,
      })
    })

    let groqBody: any = await groq.json()
    return c.text(groqBody.choices[0].message.content)
  } catch (error) {
    console.log(error);

    return c.json({
      status: "Somthing went wrong"
    }, 400)
  }
})

app.post('/test1', async (c) => {
  let reqBody = await c.req.json()
  let groq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${c.env.GROQ_KEY}`
    },
    body: JSON.stringify({
      "messages": [
        {
          "role": "system",
          "content": "You have give a description which can have details about the product or of the job or personal detail , and you have given a comment you need to reply to it as a human to promote the description in a organic and smooth way which promote the description randomly into the reply.\nReplys should be short, easy to understand.\nreply must not contain any external link.\nreply must not contains any hashtag"
        },
        {
          "role": "user",
          "content": "Description - ScreenCat - a extension to take full page screenshot"
        },
        {
          "role": "user",
          "content": `Comment - \"${reqBody.tweet}\"`
        }
      ], "model": "llama3-70b-8192",
      "temperature": 1,
      "max_tokens": 1024,
      "top_p": 1,
      "stream": false,
    })
  })
  let groqBody: any = await groq.json()
  return c.text(groqBody.choices[0].message.content)
})

export default {
  fetch: app.fetch,
  scheduled: async (batch: any, env: Bindings) => {
    const connectionString = env.DATABASE_URL
    const pool = new Pool({ connectionString })
    const adapter = new PrismaNeon(pool)
    const prisma = new pc({ adapter })
    try {
      let quota = await prisma.user.updateMany({
        where: {
          daily_quota: 10
        },
        data: {
          remaining_quota: 10
        }
      })
    } catch (error) {
      console.log(error);
    }
  }
}
