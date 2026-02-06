import { Injectable } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { ClassConstructor } from 'class-transformer';
import _ from 'lodash';
import { Socket } from 'socket.io';
import { SystemConfig } from 'src/config';
import { EventConfig } from 'src/decorators';
import { AuthDto } from 'src/dtos/auth.dto';
import { ImmichWorker, JobStatus, MetadataKey, QueueName, UserStatus } from 'src/enum';
import { ConfigRepository } from 'src/repositories/config.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { JobItem } from 'src/types';

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

  // config events
  ConfigInit: [{ newConfig: SystemConfig }];
  ConfigUpdate: [{ newConfig: SystemConfig; oldConfig: SystemConfig }];
  ConfigValidate: [{ newConfig: SystemConfig; oldConfig: SystemConfig }];

  // job events
  JobRun: [QueueName, JobItem];
  JobStart: [QueueName, JobItem];
  JobComplete: [QueueName, JobItem];
  JobSuccess: [{ job: JobItem; response?: JobStatus }];
  JobError: [{ job: JobItem; error: Error | unknown }];
  QueueStart: [{ name: QueueName }];

  // session events
  SessionDelete: [{ sessionId: string }];

  // user events
  UserCreate: [UserEvent];
  UserTrash: [UserEvent];
  UserDelete: [UserEvent];
  UserRestore: [UserEvent];

  AuthChangePassword: [{ userId: string; currentSessionId?: string; invalidateSessions?: boolean }];

  // websocket events
  WebsocketConnect: [{ userId: string }];
};

type UserEvent = {
  name: string;
  id: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  status: UserStatus;
  email: string;
  isAdmin: boolean;
  shouldChangePassword: boolean;
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
    for (const handler of handlers) {
      this.addHandler(handler);
    }
  }

  private addHandler<T extends EmitEvent>(item: Item<T>): void {
    const event = item.event;
    if (!this.emitHandlers[event]) {
      this.emitHandlers[event] = [];
    }
    this.emitHandlers[event]!.push(item);
  }

  emit<T extends EmitEvent>(event: T, ...args: ArgsOf<T>): Promise<void> {
    return this.onEvent({ name: event, args, server: false });
  }

  async onEvent<T extends EmitEvent>(event: { name: T; args: ArgsOf<T>; server: boolean }): Promise<void> {
    const handlers = this.emitHandlers[event.name] || [];
    for (const { handler, server } of handlers) {
      if (!server && event.server) {
        continue;
      }
      await handler(...event.args);
    }
  }
}
