// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

/// API-key authentication, applied to a query param, header, or cookie
/// depending on [location] (`'query'`, `'header'`, or `'cookie'`).
class ApiKeyAuth implements Authentication {
  ApiKeyAuth(this.location, this.paramName);

  final String location;
  final String paramName;

  String apiKeyPrefix = '';
  String apiKey = '';

  @override
  Future<void> applyToParams(List<QueryParam> queryParams, Map<String, String> headerParams) async {
    final paramValue = apiKeyPrefix.isEmpty ? apiKey : '$apiKeyPrefix $apiKey';
    if (paramValue.isEmpty) return;

    switch (location) {
      case 'query':
        queryParams.add(QueryParam(paramName, paramValue));
      case 'header':
        headerParams[paramName] = paramValue;
      case 'cookie':
        headerParams.update(
          'Cookie',
          (existingCookie) => '$existingCookie; $paramName=$paramValue',
          ifAbsent: () => '$paramName=$paramValue',
        );
    }
  }
}
