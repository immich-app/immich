import {
  APIKeyApi,
  ActivityApi,
  AlbumApi,
  AssetApi,
  AssetApiFp,
  AssetJobName,
  AuditApi,
  AuthenticationApi,
  DownloadApi,
  FaceApi,
  JobApi,
  JobName,
  LibraryApi,
  OAuthApi,
  PartnerApi,
  PersonApi,
  SearchApi,
  ServerInfoApi,
  SharedLinkApi,
  SystemConfigApi,
  TrashApi,
  UserApi,
  UserApiFp,
  base,
  common,
  configuration,
} from '@immich/sdk/axios';
import type { ApiParams as ApiParameters } from './types';

class ImmichApi {
  public activityApi: ActivityApi;
  public albumApi: AlbumApi;
  public downloadApi: DownloadApi;
  public libraryApi: LibraryApi;
  public assetApi: AssetApi;
  public auditApi: AuditApi;
  public authenticationApi: AuthenticationApi;
  public faceApi: FaceApi;
  public jobApi: JobApi;
  public keyApi: APIKeyApi;
  public oauthApi: OAuthApi;
  public partnerApi: PartnerApi;
  public searchApi: SearchApi;
  public serverInfoApi: ServerInfoApi;
  public sharedLinkApi: SharedLinkApi;
  public personApi: PersonApi;
  public systemConfigApi: SystemConfigApi;
  public userApi: UserApi;
  public trashApi: TrashApi;

  private config: configuration.Configuration;
  private key?: string;

  get isSharedLink() {
    return !!this.key;
  }

  constructor(parameters: configuration.ConfigurationParameters) {
    this.config = new configuration.Configuration(parameters);

    this.activityApi = new ActivityApi(this.config);
    this.albumApi = new AlbumApi(this.config);
    this.auditApi = new AuditApi(this.config);
    this.downloadApi = new DownloadApi(this.config);
    this.libraryApi = new LibraryApi(this.config);
    this.assetApi = new AssetApi(this.config);
    this.authenticationApi = new AuthenticationApi(this.config);
    this.faceApi = new FaceApi(this.config);
    this.jobApi = new JobApi(this.config);
    this.keyApi = new APIKeyApi(this.config);
    this.oauthApi = new OAuthApi(this.config);
    this.partnerApi = new PartnerApi(this.config);
    this.searchApi = new SearchApi(this.config);
    this.serverInfoApi = new ServerInfoApi(this.config);
    this.sharedLinkApi = new SharedLinkApi(this.config);
    this.personApi = new PersonApi(this.config);
    this.systemConfigApi = new SystemConfigApi(this.config);
    this.userApi = new UserApi(this.config);
    this.trashApi = new TrashApi(this.config);
  }

  private createUrl(path: string, parameters?: Record<string, unknown>) {
    const searchParameters = new URLSearchParams();
    for (const key in parameters) {
      const value = parameters[key];
      if (value !== undefined && value !== null) {
        searchParameters.set(key, value.toString());
      }
    }

    const url = new URL(path, common.DUMMY_BASE_URL);
    url.search = searchParameters.toString();

    return (this.config.basePath || base.BASE_PATH) + common.toPathString(url);
  }

  public setKey(key: string) {
    this.key = key;
  }

  public getKey(): string | undefined {
    return this.key;
  }

  public setAccessToken(accessToken: string) {
    this.config.accessToken = accessToken;
  }

  public removeAccessToken() {
    this.config.accessToken = undefined;
  }

  public setBaseUrl(baseUrl: string) {
    this.config.basePath = baseUrl;
  }

  public getAssetFileUrl(...[assetId, isThumb, isWeb]: ApiParameters<typeof AssetApiFp, 'serveFile'>) {
    const path = `/asset/file/${assetId}`;
    return this.createUrl(path, { isThumb, isWeb, key: this.getKey() });
  }

  public getAssetThumbnailUrl(...[assetId, format]: ApiParameters<typeof AssetApiFp, 'getAssetThumbnail'>) {
    const path = `/asset/thumbnail/${assetId}`;
    return this.createUrl(path, { format, key: this.getKey() });
  }

  public getProfileImageUrl(...[userId]: ApiParameters<typeof UserApiFp, 'getProfileImage'>) {
    const path = `/user/profile-image/${userId}`;
    return this.createUrl(path);
  }

  public getPeopleThumbnailUrl(personId: string) {
    const path = `/person/${personId}/thumbnail`;
    return this.createUrl(path);
  }

  public getJobName(jobName: JobName) {
    const names: Record<JobName, string> = {
      [JobName.ThumbnailGeneration]: 'Generate Thumbnails',
      [JobName.MetadataExtraction]: 'Extract Metadata',
      [JobName.Sidecar]: 'Sidecar Metadata',
      [JobName.SmartSearch]: 'Smart Search',
      [JobName.FaceDetection]: 'Face Detection',
      [JobName.FacialRecognition]: 'Facial Recognition',
      [JobName.VideoConversion]: 'Transcode Videos',
      [JobName.StorageTemplateMigration]: 'Storage Template Migration',
      [JobName.Migration]: 'Migration',
      [JobName.BackgroundTask]: 'Background Tasks',
      [JobName.Search]: 'Search',
      [JobName.Library]: 'Library',
    };

    return names[jobName];
  }

  public getAssetJobName(job: AssetJobName) {
    const names: Record<AssetJobName, string> = {
      [AssetJobName.RefreshMetadata]: 'Refresh metadata',
      [AssetJobName.RegenerateThumbnail]: 'Refresh thumbnails',
      [AssetJobName.TranscodeVideo]: 'Refresh encoded videos',
    };

    return names[job];
  }

  public getAssetJobMessage(job: AssetJobName) {
    const messages: Record<AssetJobName, string> = {
      [AssetJobName.RefreshMetadata]: 'Refreshing metadata',
      [AssetJobName.RegenerateThumbnail]: `Regenerating thumbnails`,
      [AssetJobName.TranscodeVideo]: `Refreshing encoded video`,
    };

    return messages[job];
  }
}

export const api = new ImmichApi({ basePath: '/api' });
