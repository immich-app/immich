import { Injectable } from '@nestjs/common';
import { MaintenanceStatusResponseDto } from 'src/dtos/maintenance.dto';

@Injectable()
export class MaintenanceEphemeralStateRepository {
  #secret: string = null!;
  #state: MaintenanceStatusResponseDto = {};

  setSecret(secret: string) {
    this.#secret = secret;
  }

  getSecret(): string {
    return this.#secret;
  }

  setState(state: MaintenanceStatusResponseDto) {
    this.#state = state;
  }

  getState(): MaintenanceStatusResponseDto {
    return this.#state;
  }

  getPublicState(): MaintenanceStatusResponseDto {
    const state = structuredClone(this.#state);

    if (state.error) {
      state.error = 'Something went wrong, see logs!';
    }

    return state;
  }
}
