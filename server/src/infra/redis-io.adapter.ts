import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { ServerOptions } from 'socket.io';
import { redisConfig } from './infra.config';

export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  createIOServer(port: number, options?: ServerOptions): any {
    const pubClient = new Redis(redisConfig);
    pubClient.on('error', (error) => {
      this.logger.error(`Redis pubClient: ${error}`);
    });
    const subClient = pubClient.duplicate();
    subClient.on('error', (error) => {
      this.logger.error(`Redis subClient: ${error}`);
    });
    const server = super.createIOServer(port, options);
    server.adapter(createAdapter(pubClient, subClient));
    return server;
  }
}
