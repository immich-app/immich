import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import { ImmichJwtService } from '../../modules/immich-auth/immich-jwt.service';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from '@app/database/entities/user.entity';
import { Repository } from 'typeorm';
import {ImmichAuthService} from "../../modules/immich-auth/immich-auth.service";

@WebSocketGateway()
export class CommunicationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private immichAuthService: ImmichAuthService,
  ) {}

  @WebSocketServer() server: Server;
  handleDisconnect(client: Socket) {
    client.leave(client.nsp.name);

    Logger.log(`Client ${client.id} disconnected`);
  }

  async handleConnection(client: Socket, ...args: any[]) {
    Logger.verbose(`New websocket connection: ${client.id}`, 'WSGateway');
    const accessToken = client.handshake.headers.authorization.split(' ')[1];
    const user: UserEntity | null = await this.immichAuthService.validateWsToken(accessToken);

    if (!user) {
      client.emit('error', 'unauthorized');
      client.disconnect();
      return;
    }

    Logger.log(`New webocket connection (client id: ${client.id}, user id: ${user.id})`, 'WSGateway');
    client.join(user.id);
  }
}
