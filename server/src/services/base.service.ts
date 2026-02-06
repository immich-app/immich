import { BadRequestException, Injectable } from '@nestjs/common';
import { Insertable } from 'kysely';
import { SystemConfig } from 'src/config';
import { SALT_ROUNDS } from 'src/constants';
import { UserAdmin } from 'src/database';
import { ApiKeyRepository } from 'src/repositories/api-key.repository';
import { AppRepository } from 'src/repositories/app.repository';
import { ConfigRepository } from 'src/repositories/config.repository';
import { CryptoRepository } from 'src/repositories/crypto.repository';
import { DatabaseRepository } from 'src/repositories/database.repository';
import { EventRepository } from 'src/repositories/event.repository';
import { JobRepository } from 'src/repositories/job.repository';
import { LoggingRepository } from 'src/repositories/logging.repository';
import { ProcessRepository } from 'src/repositories/process.repository';
import { SessionRepository } from 'src/repositories/session.repository';
import { SystemMetadataRepository } from 'src/repositories/system-metadata.repository';
import { TelemetryRepository } from 'src/repositories/telemetry.repository';
import { UserRepository } from 'src/repositories/user.repository';
import { WebsocketRepository } from 'src/repositories/websocket.repository';
import { UserTable } from 'src/schema/tables/user.table';
import { getConfig, updateConfig } from 'src/utils/config';

export const BASE_SERVICE_DEPENDENCIES = [
  LoggingRepository,
  ApiKeyRepository,
  AppRepository,
  ConfigRepository,
  CryptoRepository,
  DatabaseRepository,
  EventRepository,
  JobRepository,
  ProcessRepository,
  SessionRepository,
  SystemMetadataRepository,
  TelemetryRepository,
  UserRepository,
  WebsocketRepository,
];

@Injectable()
export class BaseService {
  constructor(
    protected logger: LoggingRepository,
    protected apiKeyRepository: ApiKeyRepository,
    protected appRepository: AppRepository,
    protected configRepository: ConfigRepository,
    protected cryptoRepository: CryptoRepository,
    protected databaseRepository: DatabaseRepository,
    protected eventRepository: EventRepository,
    protected jobRepository: JobRepository,
    protected processRepository: ProcessRepository,
    protected sessionRepository: SessionRepository,
    protected systemMetadataRepository: SystemMetadataRepository,
    protected telemetryRepository: TelemetryRepository,
    protected userRepository: UserRepository,
    protected websocketRepository: WebsocketRepository,
  ) {
    this.logger.setContext(this.constructor.name);
  }

  get worker() {
    return this.configRepository.getWorker();
  }

  private get configRepos() {
    return {
      configRepo: this.configRepository,
      metadataRepo: this.systemMetadataRepository,
      logger: this.logger,
    };
  }

  getConfig(options: { withCache: boolean }) {
    return getConfig(this.configRepos, options);
  }

  updateConfig(newConfig: SystemConfig) {
    return updateConfig(this.configRepos, newConfig);
  }

  async createUser(dto: Insertable<UserTable> & { email: string }): Promise<UserAdmin> {
    const exists = await this.userRepository.getByEmail(dto.email);
    if (exists) {
      throw new BadRequestException('User exists');
    }

    if (!dto.isAdmin) {
      const hasAdmin = await this.userRepository.hasAdmin();
      if (!hasAdmin) {
        throw new BadRequestException('The first registered account must be the administrator.');
      }
    }

    const payload: Insertable<UserTable> = { ...dto };
    if (payload.password) {
      payload.password = await this.cryptoRepository.hashBcrypt(payload.password, SALT_ROUNDS);
    }

    const user = await this.userRepository.create(payload);
    await this.eventRepository.emit('UserCreate', user);

    return user;
  }
}
