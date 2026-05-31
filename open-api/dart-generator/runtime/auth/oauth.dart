// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// OAuth bearer-token authentication, applied as an `Authorization: Bearer ...`
/// header.
class OAuth implements Authentication {
  OAuth({this.accessToken = ''});

  String accessToken;

  @override
  Future<void> applyToParams(List<QueryParam> queryParams, Map<String, String> headerParams) async {
    if (accessToken.isNotEmpty) {
      headerParams['Authorization'] = 'Bearer $accessToken';
    }
  }
}
