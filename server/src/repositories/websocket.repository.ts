import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthDto } from 'src/dtos/auth.dto';
import { ServerVersionResponseDto } from 'src/dtos/server.dto';
import { ArgsOf, EventRepository } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { handlePromiseError } from 'src/utils/misc';

export const serverEvents = ['ConfigUpdate'] as const;
export type ServerEvents = (typeof serverEvents)[number];

export interface ClientEventMap {
  on_user_delete: [string];
  on_server_version: [ServerVersionResponseDto];
  on_config_update: [];
  on_session_delete: [string];
}

export type AuthFn = (client: Socket) => Promise<AuthDto>;

@WebSocketGateway({
  cors: true,
  path: '/api/socket.io',
  transports: ['websocket'],
})
@Injectable()
export class WebsocketRepository implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private authFn?: AuthFn;

  @WebSocketServer()
  private server?: Server;

  constructor(
    private eventRepository: EventRepository,
    private logger: LoggingRepository,
  ) {
    this.logger.setContext(WebsocketRepository.name);
  }

  afterInit(server: Server) {
    this.logger.log('Initialized websocket server');

    for (const event of serverEvents) {
      server.on(event, (...args: ArgsOf<any>) => {
        this.logger.debug(`Server event: ${event} (receive)`);
        handlePromiseError(this.eventRepository.onEvent({ name: event, args, server: true }), this.logger);
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
      await this.eventRepository.emit('WebsocketConnect', { userId: auth.user.id });
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
