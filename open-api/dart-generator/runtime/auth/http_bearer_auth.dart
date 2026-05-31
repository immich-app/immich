// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// Supplies a bearer token, either as a literal `String` or lazily via a
/// `String Function()` resolved on each request.
typedef HttpBearerAuthProvider = String Function();

/// HTTP bearer-token authentication, applied as an `Authorization: Bearer ...`
/// header.
class HttpBearerAuth implements Authentication {
  HttpBearerAuth();

  Object? _accessToken;

  Object? get accessToken => _accessToken;

  set accessToken(Object? accessToken) {
    if (accessToken is! String && accessToken is! HttpBearerAuthProvider) {
      throw ArgumentError('accessToken value must be either a String or a String Function().');
    }
    _accessToken = accessToken;
  }

  @override
  Future<void> applyToParams(List<QueryParam> queryParams, Map<String, String> headerParams) async {
    final token = _accessToken;
    final accessToken = switch (token) {
      String() => token,
      HttpBearerAuthProvider() => token(),
      _ => null,
    };
    if (accessToken != null && accessToken.isNotEmpty) {
      headerParams['Authorization'] = 'Bearer $accessToken';
    }
  }
}
