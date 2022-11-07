import { env } from '$env/dynamic/public';
import {
	AlbumApi,
	AssetApi,
	AuthenticationApi,
	Configuration,
	DeviceInfoApi,
	JobApi,
	ServerInfoApi,
	UserApi
} from './open-api';

class ImmichApi {
	public userApi: UserApi;
	public albumApi: AlbumApi;
	public assetApi: AssetApi;
	public authenticationApi: AuthenticationApi;
	public deviceInfoApi: DeviceInfoApi;
	public serverInfoApi: ServerInfoApi;
	public jobApi: JobApi;

	private config = new Configuration({ basePath: '/api' });

	constructor() {
		this.userApi = new UserApi(this.config);
		this.albumApi = new AlbumApi(this.config);
		this.assetApi = new AssetApi(this.config);
		this.authenticationApi = new AuthenticationApi(this.config);
		this.deviceInfoApi = new DeviceInfoApi(this.config);
		this.serverInfoApi = new ServerInfoApi(this.config);
		this.jobApi = new JobApi(this.config);
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

export const api = new ImmichApi();
export const serverApi = new ImmichApi();
const immich_server_host = env.PUBLIC_IMMICH_SERVER_HOST || 'immich-server';
const immich_server_port = env.PUBLIC_IMMICH_SERVER_PORT || 3001;
const immich_server_url = 'http://' + immich_server_host + ':' + immich_server_port;
serverApi.setBaseUrl(immich_server_url);
