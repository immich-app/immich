import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ImmichJwtService, JwtValidationResult } from '../../modules/immich-jwt/immich-jwt.service';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@app/database/entities/user.entity';
import { Repository } from 'typeorm';

@WebSocketGateway({ cors: true })
export class CommunicationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private immichJwtService: ImmichJwtService,

    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  @WebSocketServer() server!: Server;

  handleDisconnect(client: Socket) {
    client.leave(client.nsp.name);

    Logger.log(`Client ${client.id} disconnected from Websocket`, 'WebsocketConnectionEvent');
  }

  async handleConnection(client: Socket) {
    try {
      Logger.log(`New websocket connection: ${client.id}`, 'WebsocketConnectionEvent');

      const accessToken = client.handshake.headers.authorization?.split(' ')[1];

      const res: JwtValidationResult = accessToken
        ? await this.immichJwtService.validateToken(accessToken)
        : { status: false, userId: null };

      if (!res.status) {
        client.emit('error', 'unauthorized');
        client.disconnect();
        return;
      }

      const user = await this.userRepository.findOne({ where: { id: res.userId } });
      if (!user) {
        client.emit('error', 'unauthorized');
        client.disconnect();
        return;
      }

      client.join(user.id);
    } catch (e) {
      // Logger.error(`Error establish websocket conneciton ${e}`, 'HandleWebscoketConnection');
    }
  }
}
