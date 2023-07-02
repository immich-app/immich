import { ImmichApi } from '../api/client';
import path from 'node:path';
import { SessionService } from '../services/session.service';
import { LoginError } from '../cores/errors/login-error';
import { exit } from 'node:process';
import os from 'os';
import { ServerVersionReponseDto, UserResponseDto } from 'src/api/open-api';

export abstract class BaseCommand {
  protected sessionService!: SessionService;
  protected immichApi!: ImmichApi;
  protected deviceId!: string;
  protected user!: UserResponseDto;
  protected serverVersion!: ServerVersionReponseDto;

  protected configDir;
  protected authPath;

  constructor() {
    const userHomeDir = os.homedir();
    this.configDir = path.join(userHomeDir, '.config/immich/');
    this.sessionService = new SessionService(this.configDir);
    this.authPath = path.join(this.configDir, 'auth.yml');
  }

  public async connect(): Promise<void> {
    try {
      this.immichApi = await this.sessionService.connect();
    } catch (error) {
      if (error instanceof LoginError) {
        console.log(error.message);
        exit(1);
      } else {
        throw error;
      }
    }
  }
}
