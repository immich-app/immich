import { Injectable } from '@nestjs/common';
import { serverVersion } from 'src/constants';
import {
  ServerAboutResponseDto,
  ServerConfigDto,
  ServerFeaturesDto,
  ServerPingResponse,
  ServerVersionResponseDto,
} from 'src/dtos/server.dto';
import { BaseService } from 'src/services/base.service';

@Injectable()
export class ServerService extends BaseService {
  ping(): ServerPingResponse {
    return { res: 'pong' };
  }

  getVersion(): ServerVersionResponseDto {
    return ServerVersionResponseDto.fromSemVer(serverVersion);
  }

  async getAboutInfo(): Promise<ServerAboutResponseDto> {
    return {
      version: serverVersion.toString(),
      versionUrl: '',
      nodejs: process.version,
    };
  }

  async getFeatures(): Promise<ServerFeaturesDto> {
    const config = await this.getConfig({ withCache: false });
    return {
      passwordLogin: config.passwordLogin.enabled,
    };
  }

  async getSystemConfig(): Promise<ServerConfigDto> {
    const config = await this.getConfig({ withCache: false });
    const isInitialized = await this.userRepository.hasAdmin();
    return {
      loginPageMessage: config.server.loginPageMessage,
      userDeleteDelay: config.user.deleteDelay,
      isInitialized,
    };
  }
}
