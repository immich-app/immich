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
} from './open-api';
import { ApiConfiguration } from '../cores/api-configuration';
import { UploadApi } from './uploadApi';

export class ImmichApi {
  public userApi: UserApi;
  public albumApi: AlbumApi;
  public assetApi: AssetApi;
  public authenticationApi: AuthenticationApi;
  public oauthApi: OAuthApi;
  public serverInfoApi: ServerInfoApi;
  public jobApi: JobApi;
  public keyApi: APIKeyApi;
  public uploadApi: UploadApi;
  public systemConfigApi: SystemConfigApi;

  private readonly config;
  public readonly apiConfiguration: ApiConfiguration;

  constructor(instanceUrl: string, apiKey: string) {
    this.apiConfiguration = new ApiConfiguration(instanceUrl, apiKey);
    this.config = new Configuration({
      basePath: instanceUrl,
      baseOptions: {
        headers: {
          'x-api-key': apiKey,
        },
      },
    });

    this.uploadApi = new UploadApi(this.config);
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
}
