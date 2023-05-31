import {
	AlbumApi,
	APIKeyApi,
	AssetApi,
	AssetApiFp,
	AuthenticationApi,
	Configuration,
	ConfigurationParameters,
	JobApi,
	OAuthApi,
	PersonApi,
	PartnerApi,
	SearchApi,
	ServerInfoApi,
	ShareApi,
	SystemConfigApi,
	UserApi,
	UserApiFp,
	JobName
} from './open-api';
import { BASE_PATH } from './open-api/base';
import { DUMMY_BASE_URL, toPathString } from './open-api/common';
import type { ApiParams } from './types';

export class ImmichApi {
	public albumApi: AlbumApi;
	public assetApi: AssetApi;
	public authenticationApi: AuthenticationApi;
	public jobApi: JobApi;
	public keyApi: APIKeyApi;
	public oauthApi: OAuthApi;
	public partnerApi: PartnerApi;
	public searchApi: SearchApi;
	public serverInfoApi: ServerInfoApi;
	public shareApi: ShareApi;
	public personApi: PersonApi;
	public systemConfigApi: SystemConfigApi;
	public userApi: UserApi;

	private config: Configuration;

	constructor(params: ConfigurationParameters) {
		this.config = new Configuration(params);

		this.albumApi = new AlbumApi(this.config);
		this.assetApi = new AssetApi(this.config);
		this.authenticationApi = new AuthenticationApi(this.config);
		this.jobApi = new JobApi(this.config);
		this.keyApi = new APIKeyApi(this.config);
		this.oauthApi = new OAuthApi(this.config);
		this.partnerApi = new PartnerApi(this.config);
		this.searchApi = new SearchApi(this.config);
		this.serverInfoApi = new ServerInfoApi(this.config);
		this.shareApi = new ShareApi(this.config);
		this.personApi = new PersonApi(this.config);
		this.systemConfigApi = new SystemConfigApi(this.config);
		this.userApi = new UserApi(this.config);
	}

	private createUrl(path: string, params?: Record<string, unknown>) {
		const searchParams = new URLSearchParams();
		for (const key in params) {
			const value = params[key];
			if (value !== undefined && value !== null) {
				searchParams.set(key, value.toString());
			}
		}

		const url = new URL(path, DUMMY_BASE_URL);
		url.search = searchParams.toString();

		return (this.config.basePath || BASE_PATH) + toPathString(url);
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

	public getAssetFileUrl(
		...[assetId, isThumb, isWeb, key]: ApiParams<typeof AssetApiFp, 'serveFile'>
	) {
		const path = `/asset/file/${assetId}`;
		return this.createUrl(path, { isThumb, isWeb, key });
	}

	public getAssetThumbnailUrl(
		...[assetId, format, key]: ApiParams<typeof AssetApiFp, 'getAssetThumbnail'>
	) {
		const path = `/asset/thumbnail/${assetId}`;
		return this.createUrl(path, { format, key });
	}

	public getProfileImageUrl(...[userId]: ApiParams<typeof UserApiFp, 'getProfileImage'>) {
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
			[JobName.ObjectTagging]: 'Tag Objects',
			[JobName.ClipEncoding]: 'Encode Clip',
			[JobName.RecognizeFaces]: 'Recognize Faces',
			[JobName.VideoConversion]: 'Transcode Videos',
			[JobName.StorageTemplateMigration]: 'Storage Template Migration',
			[JobName.BackgroundTask]: 'Background Tasks',
			[JobName.Search]: 'Search'
		};

		return names[jobName];
	}
}

export const api = new ImmichApi({ basePath: '/api' });
