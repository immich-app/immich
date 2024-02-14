import { ServerVersionResponseDto, UserResponseDto } from '@immich/sdk';
import { SessionService } from '../services/session.service';
import { ImmichApi } from 'src/services/api.service';

export abstract class BaseCommand {
  protected sessionService!: SessionService;
  protected user!: UserResponseDto;
  protected serverVersion!: ServerVersionResponseDto;

  constructor(options: { configDirectory?: string }) {
    if (!options.configDirectory) {
      throw new Error('Config directory is required');
    }
    this.sessionService = new SessionService(options.configDirectory);
  }

  public async connect(): Promise<ImmichApi> {
    return await this.sessionService.connect();
  }
}
