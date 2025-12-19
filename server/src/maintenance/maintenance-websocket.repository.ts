import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppRepository } from 'src/repositories/app.repository';
import { AppRestartEvent, ArgsOf } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';

export const serverEvents = ['AppRestart'] as const;
export type ServerEvents = (typeof serverEvents)[number];

export interface ClientEventMap {
  AppRestartV1: [AppRestartEvent];
}

@WebSocketGateway({
  cors: true,
  path: '/api/socket.io',
  transports: ['websocket'],
})
@Injectable()
export class MaintenanceWebsocketRepository implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  private websocketServer?: Server;

  constructor(
    private logger: LoggingRepository,
    private appRepository: AppRepository,
  ) {
    this.logger.setContext(MaintenanceWebsocketRepository.name);
  }

  afterInit(websocketServer: Server) {
    this.logger.log('Initialized websocket server');

    websocketServer.on('AppRestart', (event: ArgsOf<'AppRestart'>, ack?: (ok: 'ok') => void) => {
      this.logger.log(`Restarting due to event... ${JSON.stringify(event)}`);

      ack?.('ok');
      this.appRepository.exitApp();
    });
  }

  clientBroadcast<T extends keyof ClientEventMap>(event: T, ...data: ClientEventMap[T]) {
    this.websocketServer?.emit(event, ...data);
  }

  serverSend<T extends ServerEvents>(event: T, ...args: ArgsOf<T>): void {
    this.logger.debug(`Server event: ${event} (send)`);
    this.websocketServer?.serverSideEmit(event, ...args);
  }

  handleConnection(client: Socket) {
    this.logger.log(`Websocket Connect:    ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Websocket Disconnect: ${client.id}`);
  }
}
