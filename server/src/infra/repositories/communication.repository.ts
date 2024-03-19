import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/domain/auth/auth.service';
import {
  ClientEvent,
  ICommunicationRepository,
  InternalEventMap,
  OnConnectCallback,
  OnServerEventCallback,
  ServerEvent,
} from 'src/domain/repositories/communication.repository';
import { Instrumentation } from 'src/infra/instrumentation';
import { ImmichLogger } from 'src/infra/logger';

@Instrumentation()
@WebSocketGateway({
  cors: true,
  path: '/api/socket.io',
  transports: ['websocket'],
})
export class CommunicationRepository
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, ICommunicationRepository
{
  private logger = new ImmichLogger(CommunicationRepository.name);
  private onConnectCallbacks: OnConnectCallback[] = [];
  private onServerEventCallbacks: Record<ServerEvent, OnServerEventCallback[]> = {
    [ServerEvent.CONFIG_UPDATE]: [],
  };

  @WebSocketServer()
  private server?: Server;

  constructor(
    private authService: AuthService,
    private eventEmitter: EventEmitter2,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Initialized websocket server');

    for (const event of Object.values(ServerEvent)) {
      server.on(event, async () => {
        this.logger.debug(`Server event: ${event} (receive)`);
        const callbacks = this.onServerEventCallbacks[event];
        for (const callback of callbacks) {
          await callback();
        }
      });
    }
  }

  on(event: 'connect' | ServerEvent, callback: OnConnectCallback | OnServerEventCallback) {
    switch (event) {
      case 'connect': {
        this.onConnectCallbacks.push(callback);
        break;
      }

      default: {
        this.onServerEventCallbacks[event].push(callback as OnServerEventCallback);
        break;
      }
    }
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Websocket Connect:    ${client.id}`);
      const auth = await this.authService.validate(client.request.headers, {});
      await client.join(auth.user.id);
      for (const callback of this.onConnectCallbacks) {
        await callback(auth.user.id);
      }
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

  send(event: ClientEvent, userId: string, data: any) {
    this.server?.to(userId).emit(event, data);
  }

  broadcast(event: ClientEvent, data: any) {
    this.server?.emit(event, data);
  }

  sendServerEvent(event: ServerEvent) {
    this.logger.debug(`Server event: ${event} (send)`);
    this.server?.serverSideEmit(event);
  }

  emit<E extends keyof InternalEventMap>(event: E, data: InternalEventMap[E]): boolean {
    return this.eventEmitter.emit(event, data);
  }

  emitAsync<E extends keyof InternalEventMap, R = any[]>(event: E, data: InternalEventMap[E]): Promise<R> {
    return this.eventEmitter.emitAsync(event, data) as Promise<R>;
  }
}
