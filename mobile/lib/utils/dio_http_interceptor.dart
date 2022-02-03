import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:immich_mobile/constants/hive_box.dart';

class AuthenticatedRequestInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    // debugPrint('REQUEST[${options.method}] => PATH: ${options.path}');

    var box = Hive.box(userInfoBox);

    options.headers["Authorization"] = "Bearer ${box.get(accessTokenKey)}";
    options.responseType = ResponseType.plain;
    return super.onRequest(options, handler);
  }
}
