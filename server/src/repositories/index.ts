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

export const repositories = [
  ApiKeyRepository,
  AppRepository,
  ConfigRepository,
  CryptoRepository,
  DatabaseRepository,
  EventRepository,
  JobRepository,
  LoggingRepository,
  ProcessRepository,
  SessionRepository,
  SystemMetadataRepository,
  TelemetryRepository,
  UserRepository,
  WebsocketRepository,
];
