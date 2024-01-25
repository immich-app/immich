import { ImmichApi } from '../api/client';
import { SessionService } from '../services/session.service';
import { LoginError } from '../cores/errors/login-error';
import { exit } from 'node:process';
import { ServerVersionResponseDto, UserResponseDto } from '@immich/sdk';
import { BaseOptionsDto } from 'src/cores/dto/base-options-dto';

export abstract class BaseCommand {
  protected sessionService!: SessionService;
  protected immichApi!: ImmichApi;
  protected user!: UserResponseDto;
  protected serverVersion!: ServerVersionResponseDto;

  constructor(options: BaseOptionsDto) {
    if (!options.config) {
      throw new Error('Config directory is required');
    }
    this.sessionService = new SessionService(options.config);
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
