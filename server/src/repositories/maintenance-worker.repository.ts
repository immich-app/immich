import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ArgsOf } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';

export const serverEvents = ['AppRestart'] as const;
export type ServerEvents = (typeof serverEvents)[number];

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

    websocketServer.on('AppRestart', () => {
      console.info('hi');
    });

    // setTimeout(() => {
    //   this.serverSend('AppRestart', { isMaintenanceMode: false });
    // }, 5000);
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Websocket Connect:    ${client.id}`);
    // try {
    // const auth = await this.authenticate(client);
    // await client.join(auth.user.id);
    // if (auth.session) {
    //   await client.join(auth.session.id);
    // }
    // ???
    // await this.eventRepository.emit('WebsocketConnect', { userId: auth.user.id });
    // } catch (error: Error | any) {
    //   this.logger.error(`Websocket connection error: ${error}`, error?.stack);
    //   client.emit('error', 'unauthorized');
    //   client.disconnect();
    // }
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Websocket Disconnect: ${client.id}`);
    await client.leave(client.nsp.name);
  }

  // clientSend<T extends keyof ClientEventMap>(event: T, room: string, ...data: ClientEventMap[T]) {
  //   this.server?.to(room).emit(event, ...data);
  // }

  // clientBroadcast<T extends keyof ClientEventMap>(event: T, ...data: ClientEventMap[T]) {
  //   this.server?.emit(event, ...data);
  // }

  serverSend<T extends ServerEvents>(event: T, ...args: ArgsOf<T>): void {
    this.logger.debug(`Server event: ${event} (send)`);
    this.websocketServer?.serverSideEmit(event, ...args);
  }

  setCloseFn(fn: () => Promise<void>) {
    this.closeFn = fn;
  }

  // private async authenticate(client: Socket) {
  //   if (!this.authFn) {
  //     throw new Error('Auth function not set');
  //   }

  //   return this.authFn(client);
  // }
}
