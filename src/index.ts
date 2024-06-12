import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  GROQ_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()
app.use(cors())
app.get('/test', async (c) => {
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

export default app
