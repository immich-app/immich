import { IoAdapter } from '@nestjs/platform-socket.io';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

const redisHost = process.env.REDIS_HOSTNAME || 'immich_redis';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');
const redisDb = parseInt(process.env.REDIS_DBINDEX || '0');
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const redisSocket = process.env.REDIS_SOCKET || undefined;
// const pubClient = createClient({ url: `redis://${redis_host}:6379` });
// const subClient = pubClient.duplicate();

// const pubClient = createClient({
//   url: `redis://${redisHost}:${redisPort}`,
//   password: redisPassword,
// });

// const subClient = pubClient.duplicate();
// const redisAdapter = createAdapter(pubClient, subClient);

// export class RedisIoAdapter extends IoAdapter {
//   createIOServer(port: number, options?: ServerOptions): any {
//     const server = super.createIOServer(port, options);
//     server.adapter(redisAdapter);
//     return server;
//   }
// }

// import { IoAdapter } from '@nestjs/platform-socket.io';
// import { ServerOptions } from 'socket.io';
// import { createAdapter } from '@socket.io/redis-adapter';
// import { createClient } from 'redis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: any;

  async connectToRedis(): Promise<void> {
    const pubClient = createClient({
      url: `redis://${redisHost}:${redisPort}`,
      password: redisPassword,
    });
    const subClient = pubClient.duplicate();

    await Promise.all([pubClient.connect(), subClient.connect()]);

    this.adapterConstructor = createAdapter(pubClient, subClient);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}
