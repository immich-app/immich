import { ServerVersionResponseDto, UserResponseDto } from '@immich/sdk';
import { ImmichApi } from '../services/api.service';
import { SessionService } from '../services/session.service';

export abstract class BaseCommand {
  protected sessionService!: SessionService;
  protected immichApi!: ImmichApi;
  protected user!: UserResponseDto;
  protected serverVersion!: ServerVersionResponseDto;

  constructor(options: { config?: string }) {
    if (!options.config) {
      throw new Error('Config directory is required');
    }
    this.sessionService = new SessionService(options.config);
  }

  public async connect(): Promise<void> {
    this.immichApi = await this.sessionService.connect();
  }
}
