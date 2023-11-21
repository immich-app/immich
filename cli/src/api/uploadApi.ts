import { Configuration } from './open-api';

export class UploadApi {
  protected configuration: Configuration | undefined;

  constructor(configuration: Configuration) {
    this.configuration = configuration;
  }
}
