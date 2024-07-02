import { Hono } from 'hono';
import { neon } from '@neondatabase/serverless';
import { createHonoMiddleware } from '@fiberplane/hono';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq } from 'drizzle-orm';
import { users } from './db/schema';
import bigRouter from './noisy-routes';

type Bindings = {
  DATABASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', createHonoMiddleware(app))

app.route('/noisy-routes', bigRouter)

/**
 * Simple text response
 */
app.get('/text', (c) => {
  return c.text('Hello Hono!')
})

/**
 * Simple json response
 */
app.get('/json', (c) => {
  return c.json({
    message: 'Hello Hono!'
  })
})

/**
 * Long html response
 * - many fetches
 */
app.get('/html/long', async (c) => {

  let response: ReturnType<typeof fetch> | undefined;
  for (let i = 1; i <= 15; i++) {
    response = fetch("http://localhost:8788")
  }

  return c.html(await response?.then(r => r.text()) ?? "<p>Hi</p>")
})


/**
 * API call to Neon - select all users
 */
app.get('/db/select', async (c) => {
  const sql = neon(c.env.DATABASE_URL)
  const db = drizzle(sql);

  return c.json({
    users: await db.select().from(users)
  })
})

/**
 * API call to Neon that will throw error
 * - Looks for a user.id that is Nan
 */
app.get('/db/select/error', async (c) => {
  const sql = neon(c.env.DATABASE_URL)
  const db = drizzle(sql);

  return c.json({
    users: await db.select().from(users).where(eq(users.id, +"hey"))
  })
})

/**
 * API call with sequential execution
 * - Fetch to json placeholder
 * - Fetch to database
 */
app.get('/fetch/sequential', async (c) => {
  const sql = neon(c.env.DATABASE_URL)
  const db = drizzle(sql);

  const response = await fetch('https://jsonplaceholder.typicode.com/users')
  const placeholderUsers = await response.json()

  const dbUsers = await db.select().from(users)

  return c.json({
    placeholderUsers,
    dbUsers,
  })
})

/**
 * API call with uncaught error during sequential execution
 *
 * - Fetch to database
 * - Fetch to json placeholder, which then fails due to JSON parse error
 */
app.get('/fetch/sequential', async (c) => {
  const sql = neon(c.env.DATABASE_URL)
  const db = drizzle(sql);

  const dbUsers = await db.select().from(users)

  const response = await fetch('https://jsonplaceholder.typicode.com/users')
  const placeholderUsers = await response.json().then((r) => {
    return JSON.parse(r as string)
  })

  return c.json({
    placeholderUsers,
    dbUsers,
  })
})

/**
 * API call with parallel execution
 * - Fetch to json placeholder
 * - Fetch to database
 */
app.get('/fetch/parallel', async (c) => {
  const sql = neon(c.env.DATABASE_URL)
  const db = drizzle(sql);

  const placeholderP = fetch('https://jsonplaceholder.typicode.com/users').then(res => res.json())
  const dbP = db.select().from(users)

  const [placeholderUsers, dbUsers] = await Promise.all([placeholderP, dbP])

  return c.json({
    placeholderUsers,
    dbUsers,
  })
})

export default app
