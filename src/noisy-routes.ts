import { Hono } from "hono";

const app = new Hono();

for (let i = 1; i <= 25; i++) {
  app.get(`/${i}`, (c) => {
    return c.text(`This is route ${i}`);
  });
}

export default app;
