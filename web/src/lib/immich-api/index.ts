import {
	AlbumApi,
	AssetApi,
	AuthenticationApi,
	Configuration,
	DeviceInfoApi,
	ServerInfoApi,
	UserApi,
} from '../open-api';

export class ImmichApi {
	public userApi!: UserApi;
	public albumApi!: AlbumApi;
	public assetApi!: AssetApi;
	public authenticationApi!: AuthenticationApi;
	public deviceInfoApi!: DeviceInfoApi;
	public serverInfoApi!: ServerInfoApi;

	constructor(accessToken: string, basePath?: string) {
		const config = new Configuration({ accessToken, basePath });

		this.userApi = new UserApi(config);
		this.albumApi = new AlbumApi(config);
		this.assetApi = new AssetApi(config);
		this.authenticationApi = new AuthenticationApi(config);
		this.deviceInfoApi = new DeviceInfoApi(config);
		this.serverInfoApi = new ServerInfoApi(config);
	}
}
