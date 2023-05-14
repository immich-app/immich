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
	SearchApi,
	ServerInfoApi,
	ShareApi,
	SystemConfigApi,
	UserApi,
	UserApiFp
} from './open-api';
import { BASE_PATH } from './open-api/base';
import { DUMMY_BASE_URL, toPathString } from './open-api/common';
import type { ApiParams } from './types';

export class ImmichApi {
	public userApi: UserApi;
	public albumApi: AlbumApi;
	public assetApi: AssetApi;
	public authenticationApi: AuthenticationApi;
	public oauthApi: OAuthApi;
	public searchApi: SearchApi;
	public serverInfoApi: ServerInfoApi;
	public jobApi: JobApi;
	public keyApi: APIKeyApi;
	public systemConfigApi: SystemConfigApi;
	public shareApi: ShareApi;

	private config: Configuration;

	constructor(params: ConfigurationParameters) {
		this.config = new Configuration(params);

		this.userApi = new UserApi(this.config);
		this.albumApi = new AlbumApi(this.config);
		this.assetApi = new AssetApi(this.config);
		this.authenticationApi = new AuthenticationApi(this.config);
		this.oauthApi = new OAuthApi(this.config);
		this.serverInfoApi = new ServerInfoApi(this.config);
		this.jobApi = new JobApi(this.config);
		this.keyApi = new APIKeyApi(this.config);
		this.searchApi = new SearchApi(this.config);
		this.systemConfigApi = new SystemConfigApi(this.config);
		this.shareApi = new ShareApi(this.config);
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
}

export const api = new ImmichApi({ basePath: '/api' });
