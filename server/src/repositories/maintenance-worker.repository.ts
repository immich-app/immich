import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { parse } from 'cookie';
import { IncomingHttpHeaders } from 'node:http';
import { Server, Socket } from 'socket.io';
import { MaintenanceAuthDto, MaintenanceModeResponseDto } from 'src/dtos/maintenance.dto';
import { ExitCode, ImmichCookie, SystemMetadataKey } from 'src/enum';
import { ArgsOf } from 'src/repositories/event.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { MaintenanceModeState } from 'src/types';

import * as jwt from 'jsonwebtoken';
import { ConfigRepository } from 'src/repositories/config.repository';
import { MaintenanceRepository } from 'src/repositories/maintenance.repository';
import { getConfig } from 'src/utils/config';
import { getExternalDomain } from 'src/utils/misc';

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

  constructor(
    private logger: LoggingRepository,
    private configRepository: ConfigRepository,
    private systemMetadataRepository: SystemMetadataRepository,
  ) {
    this.logger.setContext(MaintenanceWorkerRepository.name);
  }

  async exitMaintenanceMode(): Promise<void> {
    const state: MaintenanceModeState = { isMaintenanceMode: false as const };
    await this.systemMetadataRepository.set(SystemMetadataKey.MaintenanceMode, state);
    this.restartApp(state);
  }

  async maintenanceSecret(): Promise<string> {
    const result = await this.systemMetadataRepository.get(SystemMetadataKey.MaintenanceMode);
    if (!result) {
      throw new Error('Unreachable: Missing metadata for maintenance mode.');
    }

    if (!result.isMaintenanceMode) {
      throw new Error('Unreachable: Not in maintenance mode.');
    }

    return result.secret;
  }

  async logSecret(): Promise<void> {
    const { server } = await getConfig(
      {
        configRepo: this.configRepository,
        metadataRepo: this.systemMetadataRepository,
        logger: this.logger,
      },
      { withCache: true },
    );

    const baseUrl = getExternalDomain(server);
    const url = MaintenanceRepository.createLoginUrl(
      baseUrl,
      {
        username: 'immich-admin',
      },
      await this.maintenanceSecret(),
    );

    this.logger.log(`\n\n🚧 Immich is in maintenance mode, you can log in using the following URL:\n${url}\n`);
  }

  async authenticate(headers: IncomingHttpHeaders): Promise<MaintenanceAuthDto> {
    const jwtToken = parse(headers.cookie || '')[ImmichCookie.MaintenanceToken];
    return this.decodeToken(jwtToken);
  }

  async decodeToken(jwtToken?: string): Promise<MaintenanceAuthDto> {
    if (!jwtToken) {
      throw new UnauthorizedException('Missing JWT Token');
    }

    try {
      const secret = await this.maintenanceSecret();
      return (jwt.verify(jwtToken, secret) as { data: MaintenanceAuthDto }).data;
    } catch {
      throw new UnauthorizedException('Invalid JWT Token');
    }
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

    // in exceptional circumstance, the application may hang
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
