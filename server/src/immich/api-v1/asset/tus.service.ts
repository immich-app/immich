import { StorageCore, StorageFolder } from '@app/domain';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { FileStore } from '@tus/file-store';
import { DataStore, EVENTS, Server } from '@tus/server';
import { IncomingMessage, ServerResponse } from 'http';
import { dirname, join, resolve } from 'node:path';
import { Route } from '../../app.interceptor';

@Injectable()
export class TusService implements OnModuleInit {
  private logger = new Logger('TusService');

  private tusServers: Record<string, Server> = {};

  onModuleInit() {
    this.logger.log('Initializing Tus Server');
  }

  async handleTus(req: IncomingMessage, res: ServerResponse<IncomingMessage>, userId: string) {
    if (!(userId in this.tusServers)) {
      this.logger.log(`Init tus server for user ${userId}`);
      this.initializeTusServer(userId);
    }

    return this.tusServers[userId].handle(req, res);
  }

  private initializeTusServer(userId: string) {
    this.tusServers[userId] = new Server({
      // For some reason, without the ../.., tus sends a Location header with
      // http://host:2283/asset/upload-tus/api/asset/upload-tus, which is wrong
      // The relative path like this solves the issue
      path: `/../../api/asset/upload-tus`,
      datastore: new FileStore({
        directory: join(StorageCore.getBaseFolder(StorageFolder.TUS_PARTIAL), userId),
      }),
    });

    this.tusServers[userId].on(EVENTS.POST_FINISH, (req, res, upload) => {
      this.logger.log(`Upload complete for file ${JSON.stringify(upload)} and server ${userId}`);
    });
  }
}
