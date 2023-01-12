import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { Logger } from '@nestjs/common';
import { UserResponseDto, UserService } from '@app/domain';
import cookieParser from 'cookie';

@WebSocketGateway({ cors: true })
export class CommunicationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger(CommunicationGateway.name);

  constructor(private immichJwtService: ImmichJwtService, private userService: UserService) {}

  @WebSocketServer() server!: Server;

  handleDisconnect(client: Socket) {
    client.leave(client.nsp.name);
    this.logger.log(`Client ${client.id} disconnected from Websocket`);
  }

  async handleConnection(client: Socket) {
    try {
      this.logger.log(`New websocket connection: ${client.id}`);

      const user = await this.validate(client);
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

  private async validate(client: Socket): Promise<UserResponseDto | null> {
    const headers = client.handshake.headers;
    const accessToken =
      this.immichJwtService.extractJwtFromCookie(cookieParser.parse(headers.cookie || '')) ||
      this.immichJwtService.extractJwtFromHeader(headers);

    if (accessToken) {
      const { userId, status } = await this.immichJwtService.validateToken(accessToken);
      if (userId && status) {
        const user = await this.userService.getUserById(userId).catch(() => null);
        if (user) {
          return user;
        }
      }
    }

    return null;
  }
}
