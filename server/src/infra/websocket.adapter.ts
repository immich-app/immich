import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/postgres-adapter';
import { ServerOptions } from 'socket.io';
import { DataSource } from 'typeorm';
import { PostgresDriver } from 'typeorm/driver/postgres/PostgresDriver.js';

const CREATE_ATTACHMENT_TABLE = `
  CREATE TABLE IF NOT EXISTS socket_io_attachments (
      id          bigserial UNIQUE,
      created_at  timestamptz DEFAULT NOW(),
      payload     bytea
  );
`;

export class WebSocketAdapter extends IoAdapter {
  constructor(private app: INestApplicationContext) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const pool = (this.app.get(DataSource).driver as PostgresDriver).master;
    pool.query(CREATE_ATTACHMENT_TABLE);
    const server = super.createIOServer(port, options);
    server.adapter(createAdapter(pool));
    return server;
  }
}
