import 'package:dio/dio.dart';
import 'package:immich_mobile/presentation/router/router.dart';
import 'package:immich_mobile/service_locator.dart';
import 'package:immich_mobile/utils/mixins/log_context.mixin.dart';

class ImmichAuthInterceptor extends Interceptor with LogContext {
  String? _accessToken;

  void setAccessToken(String token) => _accessToken = token;

  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    if (_accessToken != null) {
      options.headers["x-immich-user-token"] = _accessToken;
    }

    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    if (response.statusCode == 401) {
      log.severe("Token expired. Logging user out");
      di<AppRouter>().replaceAll([const LoginRoute()]);
      return;
    }
    handler.next(response);
  }
}
