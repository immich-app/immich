import { Inject, Injectable } from '@nestjs/common';
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
import { EventConfig } from 'src/decorators';
import { MetadataKey } from 'src/enum';
import {
  ArgsOf,
  ClientEventMap,
  EmitEvent,
  EmitHandler,
  EventItem,
  IEventRepository,
  serverEvents,
  ServerEvents,
} from 'src/interfaces/event.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { AuthService } from 'src/services/auth.service';
import { Instrumentation } from 'src/utils/instrumentation';
import { handlePromiseError } from 'src/utils/misc';

type EmitHandlers = Partial<{ [T in EmitEvent]: Array<EventItem<T>> }>;

type Item<T extends EmitEvent> = {
  event: T;
  handler: EmitHandler<T>;
  priority: number;
  server: boolean;
  label: string;
};

@Instrumentation()
@WebSocketGateway({
  cors: true,
  path: '/api/socket.io',
  transports: ['websocket'],
})
@Injectable()
export class EventRepository implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, IEventRepository {
  private emitHandlers: EmitHandlers = {};

  @WebSocketServer()
  private server?: Server;

  constructor(
    private moduleRef: ModuleRef,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(EventRepository.name);
  }

  setup({ services }: { services: ClassConstructor<unknown>[] }) {
    const reflector = this.moduleRef.get(Reflector, { strict: false });
    const repository = this.moduleRef.get<IEventRepository>(IEventRepository);
    const items: Item<EmitEvent>[] = [];

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
      repository.on(handler);
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
      const auth = await this.moduleRef.get(AuthService).authenticate({
        headers: client.request.headers,
        queryParams: {},
        metadata: { adminRoute: false, sharedLinkRoute: false, uri: '/api/socket.io' },
      });
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

  on<T extends EmitEvent>(item: EventItem<T>): void {
    const event = item.event;

    if (!this.emitHandlers[event]) {
      this.emitHandlers[event] = [];
    }

    this.emitHandlers[event].push(item);
  }

  async emit<T extends EmitEvent>(event: T, ...args: ArgsOf<T>): Promise<void> {
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
}
