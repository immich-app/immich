import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MaintenanceAuthDto, MaintenanceStatusResponseDto } from 'src/dtos/maintenance.dto';
import { AppRepository } from 'src/repositories/app.repository';
import { AppRestartEvent, ArgsOf } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';

interface ServerEventMap {
  AppRestart: [AppRestartEvent];
  MaintenanceStatus: [MaintenanceStatusResponseDto];
}

interface ClientEventMap {
  AppRestartV1: [AppRestartEvent];
  MaintenanceStatusV1: [MaintenanceStatusResponseDto];
}

type AuthFn = (client: Socket) => Promise<MaintenanceAuthDto>;
type StatusUpdateFn = (status: MaintenanceStatusResponseDto) => void;

@WebSocketGateway({
  cors: true,
  path: '/api/socket.io',
  transports: ['websocket'],
})
@Injectable()
export class MaintenanceWebsocketRepository implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private authFn?: AuthFn;
  private statusUpdateFn?: StatusUpdateFn;

  @WebSocketServer()
  private server?: Server;

  constructor(
    private logger: LoggingRepository,
    private appRepository: AppRepository,
  ) {
    this.logger.setContext(MaintenanceWebsocketRepository.name);
  }

  afterInit(server: Server) {
    this.logger.log('Initialized websocket server');
    server.on('MaintenanceStatus', (status) => this.statusUpdateFn?.(status));
    server.on('AppRestart', (event: ArgsOf<'AppRestart'>, ack?: (ok: 'ok') => void) => {
      this.logger.log(`Restarting due to event... ${JSON.stringify(event)}`);

      ack?.('ok');
      this.appRepository.exitApp();
    });
  }

  clientSend<T extends keyof ClientEventMap>(event: T, room: string, ...data: ClientEventMap[T]) {
    this.server?.to(room).emit(event, ...data);
  }

  clientBroadcast<T extends keyof ClientEventMap>(event: T, ...data: ClientEventMap[T]) {
    this.server?.emit(event, ...data);
  }

  serverSend<T extends keyof ServerEventMap>(event: T, ...args: ServerEventMap[T]): void {
    this.logger.debug(`Server event: ${event} (send)`);
    this.server?.serverSideEmit(event, ...args);
  }

  async handleConnection(client: Socket) {
    try {
      await this.authFn!(client);
      await client.join('private');
      this.logger.log(`Websocket Connect:    ${client.id} (private)`);
    } catch {
      await client.join('public');
      this.logger.log(`Websocket Connect:    ${client.id} (public)`);
    }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Websocket Disconnect: ${client.id}`);
    await Promise.allSettled([client.leave('private'), client.leave('public')]);
  }

  setAuthFn(fn: (client: Socket) => Promise<MaintenanceAuthDto>) {
    this.authFn = fn;
  }

  setStatusUpdateFn(fn: (status: MaintenanceStatusResponseDto) => void) {
    this.statusUpdateFn = fn;
  }
}
