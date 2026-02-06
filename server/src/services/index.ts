import { ApiKeyService } from 'src/services/api-key.service';
import { ApiService } from 'src/services/api.service';
import { AuthService } from 'src/services/auth.service';
import { DatabaseService } from 'src/services/database.service';
import { QueueService } from 'src/services/queue.service';
import { ServerService } from 'src/services/server.service';
import { SessionService } from 'src/services/session.service';
import { UserService } from 'src/services/user.service';

export const services = [
  ApiKeyService,
  ApiService,
  AuthService,
  DatabaseService,
  QueueService,
  ServerService,
  SessionService,
  UserService,
];
