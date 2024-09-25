import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:http/http.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/constants/globals.dart';
import 'package:immich_mobile/utils/mixins/log.mixin.dart';
import 'package:openapi/api.dart';

class ImmichApiClient extends ApiClient with LogMixin {
  ImmichApiClient({required String endpoint}) : super(basePath: endpoint);

  Map<String, String> get headers => defaultHeaderMap;

  Future<void> init({String? accessToken}) async {
    final token =
        accessToken ?? (await di<IStoreRepository>().get(StoreKey.accessToken));

    if (token != null) {
      addDefaultHeader(kImmichHeaderAuthKey, token);
    }

    final deviceInfo = DeviceInfoPlugin();
    final String deviceModel;
    if (Platform.isIOS) {
      deviceModel = (await deviceInfo.iosInfo).utsname.machine;
    } else {
      deviceModel = (await deviceInfo.androidInfo).model;
    }

    addDefaultHeader(kImmichHeaderDeviceModel, deviceModel);
    addDefaultHeader(kImmichHeaderDeviceType, Platform.operatingSystem);
  }

  @override
  Future<Response> invokeAPI(
    String path,
    String method,
    List<QueryParam> queryParams,
    Object? body,
    Map<String, String> headerParams,
    Map<String, String> formParams,
    String? contentType,
  ) async {
    final res = await super.invokeAPI(
      path,
      method,
      queryParams,
      body,
      headerParams,
      formParams,
      contentType,
    );

    if (res.statusCode == HttpStatus.unauthorized) {
      log.e("Token invalid. Redirecting to login route");
      await di<AppRouter>().replaceAll([const LoginRoute()]);
      throw ApiException(res.statusCode, "Unauthorized");
    }

    return res;
  }

  UsersApi getUsersApi() => UsersApi(this);
  ServerApi getServerApi() => ServerApi(this);
  AuthenticationApi getAuthenticationApi() => AuthenticationApi(this);
  OAuthApi getOAuthApi() => OAuthApi(this);
  SyncApi getSyncApi() => SyncApi(this);
}
