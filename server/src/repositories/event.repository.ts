import { Inject, Injectable } from '@nestjs/common';
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
  ClientEventMap,
  IEventRepository,
  ServerAsyncEventMap,
  ServerEvent,
  ServerEventMap,
} from 'src/interfaces/event.interface';
import { ILoggerRepository } from 'src/interfaces/logger.interface';
import { AuthService } from 'src/services/auth.service';
import { Instrumentation } from 'src/utils/instrumentation';

@Instrumentation()
@WebSocketGateway({
  cors: true,
  path: '/api/socket.io',
  transports: ['websocket'],
})
@Injectable()
export class EventRepository implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, IEventRepository {
  @WebSocketServer()
  private server?: Server;

  constructor(
    private authService: AuthService,
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
      const auth = await this.authService.validate(client.request.headers, {});
      await client.join(auth.user.id);
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

  clientSend<E extends keyof ClientEventMap>(event: E, userId: string, data: ClientEventMap[E]) {
    this.server?.to(userId).emit(event, data);
  }

  clientBroadcast<E extends keyof ClientEventMap>(event: E, data: ClientEventMap[E]) {
    this.server?.emit(event, data);
  }

  serverSend<E extends keyof ServerEventMap>(event: E, data: ServerEventMap[E]) {
    this.logger.debug(`Server event: ${event} (send)`);
    this.server?.serverSideEmit(event, data);
    return this.eventEmitter.emit(event, data);
  }

  serverSendAsync<E extends keyof ServerAsyncEventMap, R = any[]>(event: E, data: ServerAsyncEventMap[E]): Promise<R> {
    return this.eventEmitter.emitAsync(event, data) as Promise<R>;
  }
}
