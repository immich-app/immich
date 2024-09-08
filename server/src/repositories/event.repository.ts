import { Inject, Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  ArgsOf,
  ClientEventMap,
  EmitEvent,
  EmitHandler,
  IEventRepository,
  ServerEvent,
  ServerEventMap,
} from 'src/interfaces/event.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { AuthService } from 'src/services/auth.service';
import { Instrumentation } from 'src/utils/instrumentation';

type EmitHandlers = Partial<{ [T in EmitEvent]: EmitHandler<T>[] }>;

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
    private eventEmitter: EventEmitter2,
    @Inject(ILoggerRepository) private logger: ILoggerRepository,
  ) {
    this.logger.setContext(EventRepository.name);
  }

  afterInit(server: Server) {
    this.logger.log('Initialized websocket server');

    for (const event of Object.values(ServerEvent)) {
      if (event === ServerEvent.WEBSOCKET_CONNECT) {
        continue;
      }

      server.on(event, (data: unknown) => {
        this.logger.debug(`Server event: ${event} (receive)`);
        this.eventEmitter.emit(event, data);
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
      this.serverSend(ServerEvent.WEBSOCKET_CONNECT, { userId: auth.user.id });
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

  on<T extends EmitEvent>(event: T, handler: EmitHandler<T>): void {
    if (!this.emitHandlers[event]) {
      this.emitHandlers[event] = [];
    }

    this.emitHandlers[event].push(handler);
  }

  async emit<T extends EmitEvent>(event: T, ...args: ArgsOf<T>): Promise<void> {
    const handlers = this.emitHandlers[event] || [];
    for (const handler of handlers) {
      await handler(...args);
    }
  }

  clientSend<E extends keyof ClientEventMap>(event: E, room: string, data: ClientEventMap[E]) {
    this.server?.to(room).emit(event, data);
  }

  clientBroadcast<E extends keyof ClientEventMap>(event: E, data: ClientEventMap[E]) {
    this.server?.emit(event, data);
  }

  serverSend<E extends keyof ServerEventMap>(event: E, data: ServerEventMap[E]) {
    this.logger.debug(`Server event: ${event} (send)`);
    this.server?.serverSideEmit(event, data);
    return this.eventEmitter.emit(event, data);
  }
}
