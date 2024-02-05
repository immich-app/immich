import {
  AlbumApi,
  APIKeyApi,
  AssetApi,
  AuthenticationApi,
  Configuration,
  JobApi,
  OAuthApi,
  ServerInfoApi,
  SystemConfigApi,
  UserApi,
} from '@immich/sdk';

export class ImmichApi {
  public userApi: UserApi;
  public albumApi: AlbumApi;
  public assetApi: AssetApi;
  public authenticationApi: AuthenticationApi;
  public oauthApi: OAuthApi;
  public serverInfoApi: ServerInfoApi;
  public jobApi: JobApi;
  public keyApi: APIKeyApi;
  public systemConfigApi: SystemConfigApi;

  private readonly config;

  constructor(
    public instanceUrl: string,
    public apiKey: string,
  ) {
    this.config = new Configuration({
      basePath: instanceUrl,
      headers: {
        'x-api-key': apiKey,
      },
    });

    this.userApi = new UserApi(this.config);
    this.albumApi = new AlbumApi(this.config);
    this.assetApi = new AssetApi(this.config);
    this.authenticationApi = new AuthenticationApi(this.config);
    this.oauthApi = new OAuthApi(this.config);
    this.serverInfoApi = new ServerInfoApi(this.config);
    this.jobApi = new JobApi(this.config);
    this.keyApi = new APIKeyApi(this.config);
    this.systemConfigApi = new SystemConfigApi(this.config);
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    if (!this.config.headers) {
      throw new Error('missing headers');
    }
    this.config.headers['x-api-key'] = apiKey;
  }
}
