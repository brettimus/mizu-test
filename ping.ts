import app from './src';

type Route = {
  path: string
  method: string
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  handler: (...args: any[]) => any
}

const routes = app.routes.reduce((result, r) => {
  const isRouteHandler = r.handler.length === 1
  const isNoisyRoutes = r.path.startsWith('/noisy-routes')

  if (isRouteHandler && !isNoisyRoutes) {
    result.push({
      path: r.path,
      method: r.method,
      handler: r.handler
    })
  }

  return result
}, [] as Route[])

const baseUrl = 'http://localhost:8787'; // Adjust the base URL as needed


async function pingRoute(route: Route) {
  try {
    const response = await fetch(`${baseUrl}${route.path}`, {
      method: route.method,
    });
    // const data = await response.json();
    console.log(`Response from ${route.path}:`, response.status);
  } catch (error) {
    console.error(`Error pinging ${route.path}:`, error);
  }
}

async function pingAllRoutes() {
  for (const route of routes) {
    await pingRoute(route);
  }
}

pingAllRoutes();