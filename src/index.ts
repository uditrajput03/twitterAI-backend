import { PrismaClient } from '@prisma/client/extension'
import { decode, sign, verify } from 'hono/jwt'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { authCheck, getPrisma } from './middleware'

type Bindings = {
  GROQ_KEY: string
  JWT_SECRET: string
}
type Variables = {
  prisma: PrismaClient
}

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>()
app.use(logger())
app.use(cors())
app.use('/auth/*', authCheck)
app.use(getPrisma)
app.get('/', async (c: any) => {
  return c.text(`Hello from twitterAI`)
})
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

app.get('/auth/profile', async (c) => {
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
        verified: true
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





























// app.get('/test', async (c) => {
//   let groq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${c.env.GROQ_KEY}`
//     },
//     body: JSON.stringify({
//       "messages": [
//         {
//           "role": "system",
//           "content": "You have give a description which can have details about the product or of the job or personal detail , and you have given a comment you need to reply to it as a human to promote the description in a organic and smooth way which promote the description randomly into the reply.\nReplys should be short, easy to understand.\nreply must not contain any external link.\nreply must not contains any hashtag"
//         },
//         {
//           "role": "user",
//           "content": "Description - ScreenCat - a extension to take full page screenshot"
//         },
//         {
//           "role": "user",
//           "content": "Comment - \"I need to take full screenshot my website content\""
//         }
//       ], "model": "llama3-70b-8192",
//       "temperature": 1,
//       "max_tokens": 1024,
//       "top_p": 1,
//       "stream": false,
//     })
//   })
//   let groqBody: any = await groq.json()
//   return c.text(groqBody.choices[0].message.content)
// })

// app.post('/test1', async (c) => {
//   let reqBody = await c.req.json()
//   let groq = await fetch('https://api.groq.com/openai/v1/chat/completions', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${c.env.GROQ_KEY}`
//     },
//     body: JSON.stringify({
//       "messages": [
//         {
//           "role": "system",
//           "content": "You have give a description which can have details about the product or of the job or personal detail , and you have given a comment you need to reply to it as a human to promote the description in a organic and smooth way which promote the description randomly into the reply.\nReplys should be short, easy to understand.\nreply must not contain any external link.\nreply must not contains any hashtag"
//         },
//         {
//           "role": "user",
//           "content": "Description - ScreenCat - a extension to take full page screenshot"
//         },
//         {
//           "role": "user",
//           "content": `Comment - \"${reqBody.tweet}\"`
//         }
//       ], "model": "llama3-70b-8192",
//       "temperature": 1,
//       "max_tokens": 1024,
//       "top_p": 1,
//       "stream": false,
//     })
//   })
//   let groqBody: any = await groq.json()
//   return c.text(groqBody.choices[0].message.content)
// })

export default app
