import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AppRestartEvent } from 'src/repositories/event.repository';
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
    // => corresponds to notification.service.ts#onAppRestart
    this.websocketServer?.emit('AppRestartV1', state, () => {
      this.websocketServer!.serverSideEmit('AppRestart', state, () => {
        this.maintenanceRepository.exitApp();
      });
    });
  }

  handleConnection(client: Socket) {
    this.logger.log(`Websocket Connect:    ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Websocket Disconnect: ${client.id}`);
  }
}
