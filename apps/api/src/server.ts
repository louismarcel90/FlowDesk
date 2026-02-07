import { buildApp } from './http/app';
import { env } from './config/env';

const app = await buildApp();
await app.ready();
console.log(app.printRoutes());
await app.listen({ port: env.PORT, host: '0.0.0.0' });
