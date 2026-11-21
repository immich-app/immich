import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MaintenanceAuthDto, MaintenanceStatusResponseDto } from 'src/dtos/maintenance.dto.js';
import { AppRepository } from 'src/repositories/app.repository.js';
import { EventRepository, type AppRestartEvent, type ArgsOf } from 'src/repositories/event.repository.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { handlePromiseError } from 'src/utils/misc.js';

interface ServerEventMap {
  AppRestart: [AppRestartEvent];
  MaintenanceStatus: [MaintenanceStatusResponseDto];
}

interface ClientEventMap {
  AppRestartV1: [AppRestartEvent];
  MaintenanceStatusV1: [MaintenanceStatusResponseDto];
}

type AuthFn = (client: Socket) => Promise<MaintenanceAuthDto>;

@WebSocketGateway({
  cors: true,
  path: '/api/socket.io',
  transports: ['websocket'],
})
@Injectable()
export class MaintenanceWebsocketRepository implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  private authFn?: AuthFn;

  @WebSocketServer()
  private server?: Server;

  constructor(
    private logger: LoggingRepository,
    private appRepository: AppRepository,
    private eventRepository: EventRepository,
  ) {
    this.logger.setContext(MaintenanceWebsocketRepository.name);
  }

  afterInit(server: Server) {
    this.logger.log('Initialized websocket server');
    server.on('MaintenanceStatus', (status: MaintenanceStatusResponseDto) =>
      handlePromiseError(
        this.eventRepository.onEvent({ name: 'MaintenanceStatus', args: [status], server: true }),
        this.logger,
      ),
    );
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
    const isAuthenticated = await this.authFn!(client)
      .then(() => true)
      .catch(() => false);
    const room = isAuthenticated ? 'private' : 'public';
    await client.join(room);
    this.logger.log(`Websocket Connect:    ${client.id} (${room})`);
    await this.eventRepository.emit('MaintenanceWebsocketConnect', { clientId: client.id, isAuthenticated });
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Websocket Disconnect: ${client.id}`);
    await Promise.allSettled([client.leave('private'), client.leave('public')]);
  }

  setAuthFn(fn: (client: Socket) => Promise<MaintenanceAuthDto>) {
    this.authFn = fn;
  }
}
