import { browser } from '$app/environment';
import { env } from '$env/dynamic/public';
import {
	AlbumApi,
	APIKeyApi,
	AssetApi,
	AuthenticationApi,
	Configuration,
	DeviceInfoApi,
	JobApi,
	OAuthApi,
	ServerInfoApi,
	ShareApi,
	SystemConfigApi,
	UserApi
} from './open-api';

class ImmichApi {
	public userApi: UserApi;
	public albumApi: AlbumApi;
	public assetApi: AssetApi;
	public authenticationApi: AuthenticationApi;
	public oauthApi: OAuthApi;
	public deviceInfoApi: DeviceInfoApi;
	public serverInfoApi: ServerInfoApi;
	public jobApi: JobApi;
	public keyApi: APIKeyApi;
	public systemConfigApi: SystemConfigApi;
	public shareApi: ShareApi;

	private config = new Configuration({ basePath: '/api' });

	constructor() {
		this.userApi = new UserApi(this.config);
		this.albumApi = new AlbumApi(this.config);
		this.assetApi = new AssetApi(this.config);
		this.authenticationApi = new AuthenticationApi(this.config);
		this.oauthApi = new OAuthApi(this.config);
		this.deviceInfoApi = new DeviceInfoApi(this.config);
		this.serverInfoApi = new ServerInfoApi(this.config);
		this.jobApi = new JobApi(this.config);
		this.keyApi = new APIKeyApi(this.config);
		this.systemConfigApi = new SystemConfigApi(this.config);
		this.shareApi = new ShareApi(this.config);
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
}

const api = new ImmichApi();

if (!browser) {
	const serverUrl = env.PUBLIC_IMMICH_SERVER_URL || 'http://immich-server:3001';
	api.setBaseUrl(serverUrl);
}

export { api };
