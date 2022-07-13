import { IoAdapter } from '@nestjs/platform-socket.io';
import { RedisClient } from 'redis';
import { ServerOptions } from 'socket.io';
import { createAdapter } from 'socket.io-redis';

const redisHost = process.env.REDIS_HOSTNAME || 'immich_redis';
const redisPort = parseInt(process.env.REDIS_PORT || '6379');
const redisDb = parseInt(process.env.REDIS_DBINDEX || '0');
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const redisSocket = process.env.REDIS_SOCKET || undefined;
// const pubClient = createClient({ url: `redis://${redis_host}:6379` });
// const subClient = pubClient.duplicate();

const pubClient = new RedisClient({
  host: redisHost,
  port: redisPort,
  db: redisDb,
  password: redisPassword,
  path: redisSocket,
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
