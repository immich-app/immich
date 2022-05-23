import { IoAdapter } from '@nestjs/platform-socket.io';
import { RedisClient } from 'redis';
import { ServerOptions } from 'socket.io';
import { createAdapter } from 'socket.io-redis';

const redis_host = process.env.REDIS_HOSTNAME || 'immich_redis'
// const pubClient = createClient({ url: `redis://${redis_host}:6379` });
// const subClient = pubClient.duplicate();

const pubClient = new RedisClient({
  host: redis_host,
  port: 6379,
});

const subClient = pubClient.duplicate();
const redisAdapter = createAdapter({ pubClient, subClient });

export class RedisIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(redisAdapter);
    return server;
  }
}
