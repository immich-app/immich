import { AssetApi, DownloadApi, configuration } from '@immich/sdk/axios';

class ImmichApi {
  public downloadApi: DownloadApi;
  public assetApi: AssetApi;

  private config: configuration.Configuration;

  constructor(parameters: configuration.ConfigurationParameters) {
    this.config = new configuration.Configuration(parameters);
    this.downloadApi = new DownloadApi(this.config);
    this.assetApi = new AssetApi(this.config);
  }
}

export const api = new ImmichApi({ basePath: '/api' });
