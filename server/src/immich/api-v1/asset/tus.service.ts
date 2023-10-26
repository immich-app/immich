import { StorageCore, StorageFolder } from '@app/domain';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { FileStore } from '@tus/file-store';
import { EVENTS, Server, Upload } from '@tus/server';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { IncomingMessage, ServerResponse } from 'http';
import { randomBytes } from 'node:crypto';
import { join } from 'node:path';
import { CreateTusAssetDto } from './dto/create-asset.dto';

@Injectable()
export class TusService implements OnModuleInit {
  private logger = new Logger('TusService');

  private tusServers: Record<string, Server> = {};

  onModuleInit() {
    this.logger.log('Initializing Tus Server');
  }

  getServer(userId: string, onCreation: (server: Server) => void) {
    if (!(userId in this.tusServers)) {
      this.initializeTusServer(userId);
      onCreation(this.tusServers[userId]);
    }

    return this.tusServers[userId];
  }

  async handleTus(req: IncomingMessage, res: ServerResponse<IncomingMessage>, userId: string) {
    if (!(userId in this.tusServers)) {
      this.initializeTusServer(userId);
    }

    await this.tusServers[userId].handle(req, res);
    return this.tusServers[userId];
  }

  private initializeTusServer(userId: string) {
    this.logger.log(`Init tus server for user ${userId}`);
    this.tusServers[userId] = new Server({
      // For some reason, without the ../.., tus sends a Location header with
      // http://host:2283/asset/upload-tus/api/asset/upload-tus, which is wrong
      // The relative path like this solves the issue
      path: `/../../api/asset/upload-tus`,
      datastore: new FileStore({
        directory: join(StorageCore.getBaseFolder(StorageFolder.TUS_PARTIAL), userId),
      }),
      namingFunction: (req: IncomingMessage) => {
        const filename = this.getFilename(req);
        const extension = filename.split('.').pop();

        return randomBytes(16).toString('hex') + '.' + extension;
      },
      onUploadCreate: async (req, res, upload) => {
        const isValid = await this.validateMetadata(upload);
        if (!isValid) {
          throw { status_code: 500, body: 'Metadata sent is invalid' }; // if undefined, falls back to 500 with "Internal server error".
        }
        // We have to return the (modified) response.
        return res;
      },
    });

    this.tusServers[userId].on(EVENTS.POST_FINISH, (req, res, upload) => {
      this.logger.log(`Upload complete for file ${JSON.stringify(upload)} and server ${userId}`);
    });
  }

  getFilename(req: IncomingMessage): string {
    const metadata = this.getMetadata(req);

    if (metadata['filename'] === undefined) throw new Error(`File name not found in Upload-Metadata header!`);

    return metadata['filename']; // TODO metadata type
  }

  getMetadata(req: IncomingMessage): Record<string, string | undefined> {
    const uploadMeta = req.headersDistinct['upload-metadata']; // Lowercase

    if (uploadMeta === undefined) {
      this.logger.error(`Headers: ${JSON.stringify(req.headersDistinct)}`);
      throw new Error(`Upload-Metadata header has not been found in this request!`);
    }

    const metadata: Record<string, string> = {};
    uploadMeta[0].split(',').map((item) => {
      const tmp = item.split(' ');
      const key = tmp[0];
      const value = Buffer.from(tmp[1], 'base64').toString('ascii');
      metadata[key] = value;
    });

    return metadata;
  }

  async validateMetadata(upload: Upload): Promise<boolean> {
    const errors = await validate(plainToInstance(CreateTusAssetDto, upload.metadata), {
      forbidNonWhitelisted: true,
      forbidUnknownValues: true,
    });

    if (errors.length > 0) {
      this.logger.error('Validation for upload metadata sent from client error', errors);
      return false;
    }

    return true;
  }
}
