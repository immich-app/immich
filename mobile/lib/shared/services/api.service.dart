import 'package:openapi/api.dart';

class ApiService {
  late ApiClient _apiClient;

  late UserApi userApi;
  late AuthenticationApi authenticationApi;
  late AlbumApi albumApi;
  late AssetApi assetApi;
  late ServerInfoApi serverInfoApi;
  late DeviceInfoApi deviceInfoApi;

  setEndpoint(String endpoint) {
    _apiClient = ApiClient(basePath: endpoint);
    userApi = UserApi(_apiClient);
    authenticationApi = AuthenticationApi(_apiClient);
    albumApi = AlbumApi(_apiClient);
    assetApi = AssetApi(_apiClient);
    serverInfoApi = ServerInfoApi(_apiClient);
    deviceInfoApi = DeviceInfoApi(_apiClient);
  }

  setAccessToken(String accessToken) {
    _apiClient.addDefaultHeader('Authorization', 'Bearer $accessToken');
  }
}
