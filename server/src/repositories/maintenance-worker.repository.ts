import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppRestartEvent, ArgsOf } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { MaintenanceRepository } from 'src/repositories/maintenance.repository';

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
export class MaintenanceWorkerRepository implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  private websocketServer?: Server;

  constructor(
    private logger: LoggingRepository,
    private maintenanceRepository: MaintenanceRepository,
  ) {
    this.logger.setContext(MaintenanceWorkerRepository.name);
  }

  afterInit(websocketServer: Server) {
    this.logger.log('Initialized websocket server');
    websocketServer.on('AppRestart', () => this.maintenanceRepository.exitApp());
  }

  restartApp(state: AppRestartEvent) {
    this.clientBroadcast('AppRestartV1', state);
    this.serverSend('AppRestart', state);
    this.maintenanceRepository.exitApp();
  }

  handleConnection(client: Socket) {
    this.logger.log(`Websocket Connect:    ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Websocket Disconnect: ${client.id}`);
    await client.leave(client.nsp.name);
  }

  clientBroadcast<T extends keyof ClientEventMap>(event: T, ...data: ClientEventMap[T]) {
    this.websocketServer?.emit(event, ...data);
  }

  serverSend<T extends ServerEvents>(event: T, ...args: ArgsOf<T>): void {
    this.logger.debug(`Server event: ${event} (send)`);
    this.websocketServer?.serverSideEmit(event, ...args);
  }
}
