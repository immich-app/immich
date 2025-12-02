import { Injectable } from '@nestjs/common';
import { MaintenanceStatusResponseDto } from 'src/dtos/maintenance.dto';
import { MaintenanceAction } from 'src/enum';

@Injectable()
export class MaintenanceEphemeralStateRepository {
  #secret: string = null!;
  #state: MaintenanceStatusResponseDto = {
    active: true,
    action: MaintenanceAction.Start,
  };

  setSecret(secret: string) {
    this.#secret = secret;
  }

  getSecret(): string {
    return this.#secret;
  }

  setStatus(state: MaintenanceStatusResponseDto) {
    this.#state = state;
  }

  getStatus(): MaintenanceStatusResponseDto {
    return this.#state;
  }

  getPublicStatus(): MaintenanceStatusResponseDto {
    const state = structuredClone(this.#state);

    if (state.error) {
      state.error = 'Something went wrong, see logs!';
    }

    return state;
  }
}
