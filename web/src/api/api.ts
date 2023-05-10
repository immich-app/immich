import {
	AlbumApi,
	APIKeyApi,
	AssetApi,
	AuthenticationApi,
	Configuration,
	ConfigurationParameters,
	JobApi,
	OAuthApi,
	PartnerApi,
	SearchApi,
	ServerInfoApi,
	ShareApi,
	SystemConfigApi,
	ThumbnailFormat,
	UserApi
} from './open-api';
import { BASE_PATH } from './open-api/base';
import { DUMMY_BASE_URL, toPathString } from './open-api/common';

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

	public getAssetFileUrl(assetId: string, isThumb?: boolean, isWeb?: boolean, key?: string) {
		const path = `/asset/file/${assetId}`;
		return this.createUrl(path, { isThumb, isWeb, key });
	}

	public getAssetThumbnailUrl(assetId: string, format?: ThumbnailFormat, key?: string) {
		const path = `/asset/thumbnail/${assetId}`;
		return this.createUrl(path, { format, key });
	}
}

export const api = new ImmichApi({ basePath: '/api' });
