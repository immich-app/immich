import { ImmichApi } from '../api/client';
import path from 'node:path';
import { SessionService } from '../services/session.service';
import { LoginError } from '../cores/errors/login-error';
import { exit } from 'node:process';
import { ServerVersionResponseDto, UserResponseDto } from 'src/api/open-api';

export abstract class BaseCommand {
  protected sessionService!: SessionService;
  protected immichApi!: ImmichApi;
  protected user!: UserResponseDto;
  protected serverVersion!: ServerVersionResponseDto;

  constructor() {
    this.sessionService = new SessionService();
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
