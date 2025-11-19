import { Injectable } from '@nestjs/common';

@Injectable()
export class MaintenanceEphemeralStateRepository {
  #secret: string = null!;

  setSecret(secret: string) {
    this.#secret = secret;
  }

  getSecret() {
    return this.#secret;
  }
}
