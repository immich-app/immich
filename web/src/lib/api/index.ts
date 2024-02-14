import { AssetApi, DownloadApi, configuration } from '@immich/sdk/axios';

class ImmichApi {
  public downloadApi: DownloadApi;
  public assetApi: AssetApi;

  constructor(parameters: configuration.ConfigurationParameters) {
    const config = new configuration.Configuration(parameters);
    this.downloadApi = new DownloadApi(config);
    this.assetApi = new AssetApi(config);
  }
}

export const api = new ImmichApi({ basePath: '/api' });
