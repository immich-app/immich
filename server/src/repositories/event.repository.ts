import { Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ClassConstructor } from 'class-transformer';
import _ from 'lodash';
import { Server, Socket } from 'socket.io';
import { SystemConfig } from 'src/config';
import { EventConfig } from 'src/decorators';
import { AssetResponseDto } from 'src/dtos/asset-response.dto';
import { AuthDto } from 'src/dtos/auth.dto';
import { NotificationDto } from 'src/dtos/notification.dto';
import { ReleaseNotification, ServerVersionResponseDto } from 'src/dtos/server.dto';
import { ImmichWorker, MetadataKey, QueueName } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { JobItem } from 'src/types';
import { handlePromiseError } from 'src/utils/misc';

type EmitHandlers = Partial<{ [T in EmitEvent]: Array<EventItem<T>> }>;

type Item<T extends EmitEvent> = {
  event: T;
  handler: EmitHandler<T>;
  priority: number;
  server: boolean;
  label: string;
};

type EventMap = {
  // app events
  'app.bootstrap': [];
  'app.shutdown': [];

  'config.init': [{ newConfig: SystemConfig }];
  // config events
  'config.update': [
    {
      newConfig: SystemConfig;
      oldConfig: SystemConfig;
    },
  ];
  'config.validate': [{ newConfig: SystemConfig; oldConfig: SystemConfig }];

  // album events
  'album.update': [{ id: string; recipientIds: string[] }];
  'album.invite': [{ id: string; userId: string }];

  // asset events
  'asset.tag': [{ assetId: string }];
  'asset.untag': [{ assetId: string }];
  'asset.hide': [{ assetId: string; userId: string }];
  'asset.show': [{ assetId: string; userId: string }];
  'asset.trash': [{ assetId: string; userId: string }];
  'asset.delete': [{ assetId: string; userId: string }];

  // asset bulk events
  'assets.trash': [{ assetIds: string[]; userId: string }];
  'assets.delete': [{ assetIds: string[]; userId: string }];
  'assets.restore': [{ assetIds: string[]; userId: string }];

  'job.start': [QueueName, JobItem];
  'job.failed': [{ job: JobItem; error: Error | any }];

  // session events
  'session.delete': [{ sessionId: string }];

  // stack events
  'stack.create': [{ stackId: string; userId: string }];
  'stack.update': [{ stackId: string; userId: string }];
  'stack.delete': [{ stackId: string; userId: string }];

  // stack bulk events
  'stacks.delete': [{ stackIds: string[]; userId: string }];

  // user events
  'user.signup': [{ notify: boolean; id: string; tempPassword?: string }];

  // websocket events
  'websocket.connect': [{ userId: string }];
};

export const serverEvents = ['config.update'] as const;
export type ServerEvents = (typeof serverEvents)[number];

export type EmitEvent = keyof EventMap;
export type EmitHandler<T extends EmitEvent> = (...args: ArgsOf<T>) => Promise<void> | void;
export type ArgOf<T extends EmitEvent> = EventMap[T][0];
export type ArgsOf<T extends EmitEvent> = EventMap[T];

export interface ClientEventMap {
  on_upload_success: [AssetResponseDto];
  on_user_delete: [string];
  on_asset_delete: [string];
  on_asset_trash: [string[]];
  on_asset_update: [AssetResponseDto];
  on_asset_hidden: [string];
  on_asset_restore: [string[]];
  on_asset_stack_update: string[];
  on_person_thumbnail: [string];
  on_server_version: [ServerVersionResponseDto];
  on_config_update: [];
  on_new_release: [ReleaseNotification];
  on_notification: [NotificationDto];
  on_session_delete: [string];
}

export type EventItem<T extends EmitEvent> = {
  event: T;
  handler: EmitHandler<T>;
  server: boolean;
};

export type AuthFn = (client: Socket) => Promise<AuthDto>;

@WebSocketGateway({
  cors: true,
  path: '/api/socket.io',
  transports: ['websocket'],
})
@Injectable()
export class EventRepository implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private emitHandlers: EmitHandlers = {};
  private authFn?: AuthFn;

  @WebSocketServer()
  private server?: Server;

  constructor(
    private moduleRef: ModuleRef,
    private configRepository: ConfigRepository,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(EventRepository.name);
  }

  setup({ services }: { services: ClassConstructor<unknown>[] }) {
    const reflector = this.moduleRef.get(Reflector, { strict: false });
    const items: Item<EmitEvent>[] = [];
    const worker = this.configRepository.getWorker();
    if (!worker) {
      throw new Error('Unable to determine worker type');
    }

    // discovery
    for (const Service of services) {
      const instance = this.moduleRef.get<any>(Service);
      const ctx = Object.getPrototypeOf(instance);
      for (const property of Object.getOwnPropertyNames(ctx)) {
        const descriptor = Object.getOwnPropertyDescriptor(ctx, property);
        if (!descriptor || descriptor.get || descriptor.set) {
          continue;
        }

        const handler = instance[property];
        if (typeof handler !== 'function') {
          continue;
        }

        const event = reflector.get<EventConfig>(MetadataKey.EVENT_CONFIG, handler);
        if (!event) {
          continue;
        }

        const workers = event.workers ?? Object.values(ImmichWorker);
        if (!workers.includes(worker)) {
          continue;
        }

        items.push({
          event: event.name,
          priority: event.priority || 0,
          server: event.server ?? false,
          handler: handler.bind(instance),
          label: `${Service.name}.${handler.name}`,
        });
      }
    }

    const handlers = _.orderBy(items, ['priority'], ['asc']);

    // register by priority
    for (const handler of handlers) {
      this.addHandler(handler);
    }
  }

  afterInit(server: Server) {
    this.logger.log('Initialized websocket server');

    for (const event of serverEvents) {
      server.on(event, (...args: ArgsOf<any>) => {
        this.logger.debug(`Server event: ${event} (receive)`);
        handlePromiseError(this.onEvent({ name: event, args, server: true }), this.logger);
      });
    }
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Websocket Connect:    ${client.id}`);
      const auth = await this.authenticate(client);
      await client.join(auth.user.id);
      if (auth.session) {
        await client.join(auth.session.id);
      }
      await this.onEvent({ name: 'websocket.connect', args: [{ userId: auth.user.id }], server: false });
    } catch (error: Error | any) {
      this.logger.error(`Websocket connection error: ${error}`, error?.stack);
      client.emit('error', 'unauthorized');
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Websocket Disconnect: ${client.id}`);
    await client.leave(client.nsp.name);
  }

  private addHandler<T extends EmitEvent>(item: Item<T>): void {
    const event = item.event;

    if (!this.emitHandlers[event]) {
      this.emitHandlers[event] = [];
    }

    this.emitHandlers[event].push(item);
  }

  emit<T extends EmitEvent>(event: T, ...args: ArgsOf<T>): Promise<void> {
    return this.onEvent({ name: event, args, server: false });
  }

  private async onEvent<T extends EmitEvent>(event: { name: T; args: ArgsOf<T>; server: boolean }): Promise<void> {
    const handlers = this.emitHandlers[event.name] || [];
    for (const { handler, server } of handlers) {
      // exclude handlers that ignore server events
      if (!server && event.server) {
        continue;
      }

      await handler(...event.args);
    }
  }

  clientSend<T extends keyof ClientEventMap>(event: T, room: string, ...data: ClientEventMap[T]) {
    this.server?.to(room).emit(event, ...data);
  }

  clientBroadcast<T extends keyof ClientEventMap>(event: T, ...data: ClientEventMap[T]) {
    this.server?.emit(event, ...data);
  }

  serverSend<T extends ServerEvents>(event: T, ...args: ArgsOf<T>): void {
    this.logger.debug(`Server event: ${event} (send)`);
    this.server?.serverSideEmit(event, ...args);
  }

  setAuthFn(fn: (client: Socket) => Promise<AuthDto>) {
    this.authFn = fn;
  }

  private async authenticate(client: Socket) {
    if (!this.authFn) {
      throw new Error('Auth function not set');
    }

    return this.authFn(client);
  }
}
