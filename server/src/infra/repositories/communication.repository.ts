import { AuthService, Callback, CommunicationEvent, ICommunicationRepository } from '@app/domain';
import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true, path: '/api/socket.io' })
export class CommunicationRepository implements OnGatewayConnection, OnGatewayDisconnect, ICommunicationRepository {
  private logger = new Logger(CommunicationRepository.name);
  private onConnectCallbacks: Callback[] = [];

  constructor(private authService: AuthService) {}

  @WebSocketServer() server?: Server;

  addEventListener(event: 'connect', callback: Callback) {
    this.onConnectCallbacks.push(callback);
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`Websocket Connect:    ${client.id}`);
      const user = await this.authService.validate(client.request.headers, {});
      await client.join(user.id);
      for (const callback of this.onConnectCallbacks) {
        await callback(user.id);
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

  send(event: CommunicationEvent, userId: string, data: any) {
    this.server?.to(userId).emit(event, data);
  }

  broadcast(event: CommunicationEvent, data: any) {
    this.server?.emit(event, data);
  }
}
