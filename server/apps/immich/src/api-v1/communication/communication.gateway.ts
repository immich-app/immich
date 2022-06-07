import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { CommunicationService } from './communication.service';
import { Socket, Server } from 'socket.io';
import { ImmichJwtService } from '../../modules/immich-jwt/immich-jwt.service';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@app/database/entities/user.entity';
import { Repository } from 'typeorm';

@WebSocketGateway()
export class CommunicationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private immichJwtService: ImmichJwtService,

    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  @WebSocketServer() server: Server;

  handleDisconnect(client: Socket) {
    client.leave(client.nsp.name);

    Logger.log(`Client ${client.id} disconnected`);
  }

  async handleConnection(client: Socket, ...args: any[]) {
    Logger.log(`New websocket connection: ${client.id}`, 'NewWebSocketConnection');
    const accessToken = client.handshake.headers.authorization.split(' ')[1];
    const res = await this.immichJwtService.validateToken(accessToken);

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
  }
}
