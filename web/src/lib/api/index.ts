import { AssetApi, configuration } from '@immich/sdk/axios';

class ImmichApi {
  public assetApi: AssetApi;

  constructor(parameters: configuration.ConfigurationParameters) {
    const config = new configuration.Configuration(parameters);
    this.assetApi = new AssetApi(config);
  }
}

export const api = new ImmichApi({ basePath: '/api' });
