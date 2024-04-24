//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

import 'package:dio/dio.dart';
import 'package:openapi/src/auth/auth.dart';

class BearerAuthInterceptor extends AuthInterceptor {
  final Map<String, String> tokens = {};

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) {
    final authInfo = getAuthInfo(options, (secure) => secure['type'] == 'http' && secure['scheme'] == 'bearer');
    for (final info in authInfo) {
      final token = tokens[info['name']];
      if (token != null) {
        options.headers['Authorization'] = 'Bearer ${token}';
        break;
      }
    }
    super.onRequest(options, handler);
  }
}
