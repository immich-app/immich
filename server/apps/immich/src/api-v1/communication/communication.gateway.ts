import { Logger } from '@nestjs/common';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '@app/domain';

@WebSocketGateway({ cors: true })
export class CommunicationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger(CommunicationGateway.name);

  constructor(private authService: AuthService) {}

  @WebSocketServer() server!: Server;

  handleDisconnect(client: Socket) {
    client.leave(client.nsp.name);
    this.logger.log(`Client ${client.id} disconnected from Websocket`);
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`New websocket connection: ${client.id}`);
      const user = await this.authService.validate(client.request.headers);
      if (user) {
        client.join(user.id);
      } else {
        client.emit('error', 'unauthorized');
        client.disconnect();
      }
    } catch (e) {
      // Logger.error(`Error establish websocket conneciton ${e}`, 'HandleWebscoketConnection');
    }
  }
}
