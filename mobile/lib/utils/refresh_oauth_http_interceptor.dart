import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:immich_mobile/constants/hive_box.dart';
import 'package:immich_mobile/modules/login/services/oauth2.service.dart';

class RefreshOAuthTokenInterceptor extends Interceptor {

  Future<Response<dynamic>> _retry(RequestOptions requestOptions) async {
    var box = Hive.box(userInfoBox);
    requestOptions.headers["Authorization"] = "Bearer ${box.get(accessTokenKey)}";

    debugPrint("Retrying request with new token");

    return Dio().request(requestOptions.path,
                         data: requestOptions.data,
                         queryParameters: requestOptions.queryParameters,
                         options: Options(
                           method: requestOptions.method,
                           headers: requestOptions.headers,
                         ));
  }

  Future<bool> refreshToken() async {
    debugPrint("Refreshing OAuth2 token");
    return OAuth2Service.refreshToken();
  }

  @override
  void onError(DioError err, ErrorInterceptorHandler handler) async {

    debugPrint("RefreshOAuthTokenInterceptor");

    if (err.response?.statusCode != 403 &&
        err.response?.statusCode != 401) {
      return super.onError(err, handler);
    }

    if (!(await refreshToken())) {
      return super.onError(err, handler);
    }

    await _retry(err.requestOptions)
        .then((value) => handler.resolve(value));
  }
}
