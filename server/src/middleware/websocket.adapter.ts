import { INestApplication, Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Pool, PoolConfig } from 'pg';
import type { ServerOptions } from 'socket.io';
import { SocketIoAdapter } from 'src/enum';
import { createBroadcastChannelAdapter } from 'src/middleware/broadcast-channel.adapter';
import { ConfigRepository } from 'src/repositories/config.repository';
import { asPostgresConnectionConfig } from 'src/utils/database';

export type Ssl = 'require' | 'allow' | 'prefer' | 'verify-full' | boolean | object;

export function asPgPoolSsl(ssl?: Ssl): PoolConfig['ssl'] {
  if (ssl === undefined || ssl === false || ssl === 'allow') {
    return false;
  }

  if (ssl === true || ssl === 'prefer' || ssl === 'require') {
    return { rejectUnauthorized: false };
  }

  if (ssl === 'verify-full') {
    return { rejectUnauthorized: true };
  }

  return ssl;
}

class BroadcastChannelSocketAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createBroadcastChannelAdapter>;

  constructor(app: INestApplication) {
    super(app);
    this.adapterConstructor = createBroadcastChannelAdapter();
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}

class PostgresSocketAdapter extends IoAdapter {
  private adapterConstructor: any;

  constructor(app: INestApplication, adapterConstructor: any) {
    super(app);
    this.adapterConstructor = adapterConstructor;
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, options);
    server.adapter(this.adapterConstructor);
    return server;
  }
}

export async function createWebSocketAdapter(
  app: INestApplication,
  adapterOverride?: SocketIoAdapter,
): Promise<IoAdapter> {
  const logger = new Logger('WebSocketAdapter');
  const config = new ConfigRepository();
  const { database, socketIo } = config.getEnv();
  const adapter = adapterOverride ?? socketIo.adapter;

  switch (adapter) {
    case SocketIoAdapter.Postgres: {
      logger.log('Using Postgres Socket.IO adapter');
      const { createAdapter } = await import('@socket.io/postgres-adapter');
      const config = asPostgresConnectionConfig(database.config);
      const pool = new Pool({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password,
        database: config.database,
        ssl: asPgPoolSsl(config.ssl),
        max: 2,
      });

      await pool.query(`
        CREATE TABLE IF NOT EXISTS socket_io_attachments (
            id          bigserial UNIQUE,
            created_at  timestamptz DEFAULT NOW(),
            payload     bytea
        );
      `);

      pool.on('error', (error) => {
        logger.error(' Postgres pool error', error);
      });

      const adapterConstructor = createAdapter(pool);
      return new PostgresSocketAdapter(app, adapterConstructor);
    }

    case SocketIoAdapter.BroadcastChannel: {
      logger.log('Using BroadcastChannel Socket.IO adapter');
      return new BroadcastChannelSocketAdapter(app);
    }
  }
}
