import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { FileStore } from '@tus/file-store';
import { DataStore, EVENTS, Server } from '@tus/server';
import { IncomingMessage, ServerResponse } from 'http';
import { Route } from '../../app.interceptor';

@Injectable()
export class TusService implements OnModuleInit {
  private logger = new Logger('TusService');

  private readonly tusServer = new Server({
    path: `/api/${Route.ASSET}/upload-tus`,
    datastore: new FileStore({ directory: '/local-store' }),
  });

  onModuleInit() {
    this.initializeTusServer();
  }

  async handleTus(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
    return this.tusServer.handle(req, res);
  }

  private initializeTusServer() {
    this.logger.verbose('Initializing Tus Server');

    this.tusServer.on(EVENTS.POST_FINISH, (req, res, upload) => {
      this.logger.verbose(`Upload complete for file ${JSON.stringify(upload)}`);
    });
  }
}
