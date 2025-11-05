import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MaintenanceModeResponseDto } from 'src/dtos/maintenance.dto';
import { ExitCode } from 'src/enum';
import { ArgsOf } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';

export const serverEvents = ['AppRestart'] as const;
export type ServerEvents = (typeof serverEvents)[number];

export interface ClientEventMap {
  on_server_restart: [MaintenanceModeResponseDto];
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
  private closeFn?: () => Promise<void>;

  constructor(private logger: LoggingRepository) {
    this.logger.setContext(MaintenanceWorkerRepository.name);
  }

  afterInit(websocketServer: Server) {
    this.logger.log('Initialized websocket server');
    websocketServer.on('AppRestart', () => this.exitApp());
  }

  restartApp(state: MaintenanceModeResponseDto) {
    this.clientBroadcast('on_server_restart', state);
    this.serverSend('AppRestart', state);
    this.exitApp();
  }

  private exitApp() {
    this.closeFn?.().then(() => process.exit(ExitCode.AppRestart));

    // mirroring behaviour of maintenance service
    // although there shouldn't be any reason for
    // the maintenance module to hang
    setTimeout(() => process.exit(ExitCode.AppRestart), 5000);
  }

  async handleConnection(client: Socket) {
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

  setCloseFn(fn: () => Promise<void>) {
    this.closeFn = fn;
  }
}
