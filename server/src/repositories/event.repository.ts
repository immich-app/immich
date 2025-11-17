import { Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { ClassConstructor } from 'class-transformer';
import _ from 'lodash';
import { Socket } from 'socket.io';
import { SystemConfig } from 'src/config';
import { Asset } from 'src/database';
import { EventConfig } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { ImmichWorker, JobStatus, MetadataKey, QueueName, UserAvatarColor, UserStatus } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { JobItem, JobSource } from 'src/types';

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
  AppBootstrap: [];
  AppShutdown: [];

  ConfigInit: [{ newConfig: SystemConfig }];
  // config events
  ConfigUpdate: [
    {
      newConfig: SystemConfig;
      oldConfig: SystemConfig;
    },
  ];
  ConfigValidate: [{ newConfig: SystemConfig; oldConfig: SystemConfig }];

  // album events
  AlbumUpdate: [{ id: string; recipientId: string }];
  AlbumInvite: [{ id: string; userId: string }];

  // asset events
  AssetCreate: [{ asset: Asset }];
  AssetTag: [{ assetId: string }];
  AssetUntag: [{ assetId: string }];
  AssetHide: [{ assetId: string; userId: string }];
  AssetShow: [{ assetId: string; userId: string }];
  AssetTrash: [{ assetId: string; userId: string }];
  AssetDelete: [{ assetId: string; userId: string }];
  AssetMetadataExtracted: [{ assetId: string; userId: string; source?: JobSource }];

  // asset bulk events
  AssetTrashAll: [{ assetIds: string[]; userId: string }];
  AssetDeleteAll: [{ assetIds: string[]; userId: string }];
  AssetRestoreAll: [{ assetIds: string[]; userId: string }];

  /** a worker receives a job and emits this event to run it */
  JobRun: [QueueName, JobItem];
  /** job pre-hook */
  JobStart: [QueueName, JobItem];
  /** job post-hook */
  JobComplete: [QueueName, JobItem];
  /** job finishes without error */
  JobSuccess: [JobSuccessEvent];
  /** job finishes with error */
  JobError: [JobErrorEvent];

  // queue events
  QueueStart: [QueueStartEvent];

  // session events
  SessionDelete: [{ sessionId: string }];

  // stack events
  StackCreate: [{ stackId: string; userId: string }];
  StackUpdate: [{ stackId: string; userId: string }];
  StackDelete: [{ stackId: string; userId: string }];

  // stack bulk events
  StackDeleteAll: [{ stackIds: string[]; userId: string }];

  // user events
  UserSignup: [{ notify: boolean; id: string; password?: string }];
  UserCreate: [UserEvent];
  /** user is soft deleted */
  UserTrash: [UserEvent];
  /** user is permanently deleted */
  UserDelete: [UserEvent];
  UserRestore: [UserEvent];

  AuthChangePassword: [{ userId: string; currentSessionId?: string; invalidateSessions?: boolean }];

  // websocket events
  WebsocketConnect: [{ userId: string }];
};

type JobSuccessEvent = { job: JobItem; response?: JobStatus };
type JobErrorEvent = { job: JobItem; error: Error | any };

type QueueStartEvent = {
  name: QueueName;
};

type UserEvent = {
  name: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  status: UserStatus;
  email: string;
  profileImagePath: string;
  isAdmin: boolean;
  shouldChangePassword: boolean;
  avatarColor: UserAvatarColor | null;
  oauthId: string;
  storageLabel: string | null;
  quotaSizeInBytes: number | null;
  quotaUsageInBytes: number;
  profileChangedAt: Date;
};

export type EmitEvent = keyof EventMap;
export type EmitHandler<T extends EmitEvent> = (...args: ArgsOf<T>) => Promise<void> | void;
export type ArgOf<T extends EmitEvent> = EventMap[T][0];
export type ArgsOf<T extends EmitEvent> = EventMap[T];

export type EventItem<T extends EmitEvent> = {
  event: T;
  handler: EmitHandler<T>;
  server: boolean;
};

export type AuthFn = (client: Socket) => Promise<AuthDto>;

@Injectable()
export class EventRepository {
  private emitHandlers: EmitHandlers = {};

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

        const event = reflector.get<EventConfig>(MetadataKey.EventConfig, handler);
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

  async onEvent<T extends EmitEvent>(event: { name: T; args: ArgsOf<T>; server: boolean }): Promise<void> {
    const handlers = this.emitHandlers[event.name] || [];
    for (const { handler, server } of handlers) {
      // exclude handlers that ignore server events
      if (!server && event.server) {
        continue;
      }

      await handler(...event.args);
    }
  }
}
