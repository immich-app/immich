import { ApiKeyController } from 'src/controllers/api-key.controller';
import { AppController } from 'src/controllers/app.controller';
import { AuthController } from 'src/controllers/auth.controller';
import { ServerController } from 'src/controllers/server.controller';
import { SessionController } from 'src/controllers/session.controller';
import { UserController } from 'src/controllers/user.controller';

export const controllers = [
  ApiKeyController,
  AppController,
  AuthController,
  ServerController,
  SessionController,
  UserController,
];
