import 'package:hive/hive.dart';
import 'package:openapi/api.dart';

import '../../constants/hive_box.dart';

class ApiBearerAuth extends Authentication {
  @override
  void applyToParams(List<QueryParam> queryParams,
      Map<String, String> headerParams) {}
}

class ApiService {
  late ApiClient apiClient;

  late UserApi userApi;

  ApiService() {
    String serverEndpoint = Hive.box(userInfoBox).get(serverEndpointKey);
    String accessToken = Hive.box(userInfoBox).get(accessTokenKey);

    apiClient = ApiClient(basePath: serverEndpoint);

    defaultApiClient = apiClient;
    userApi = UserApi();
  }
}
