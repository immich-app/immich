import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { ServerOptions } from 'socket.io';
import { redisConfig } from './infra.config';

export class RedisIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const pubClient = new Redis(redisConfig);
    const subClient = pubClient.duplicate();
    const server = super.createIOServer(port, options);
    server.adapter(createAdapter(pubClient, subClient));
    return server;
  }
}
