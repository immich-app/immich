// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class AuthenticationAdminApi {
  AuthenticationAdminApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion unlinkAllOAuthAccountsAdminAddedIn = .new(1, 0, 0);

  static const ApiState unlinkAllOAuthAccountsAdminState = .stable;

  /// Unlink all OAuth accounts
  ///
  /// Unlinks all OAuth accounts associated with user accounts in the system.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> unlinkAllOAuthAccountsAdminWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/admin/auth/unlink-all';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Unlink all OAuth accounts
  ///
  /// Unlinks all OAuth accounts associated with user accounts in the system.
  ///
  /// Available since server v1.0.0.
  Future<void> unlinkAllOAuthAccountsAdmin({Future<void>? abortTrigger}) async {
    final response = await unlinkAllOAuthAccountsAdminWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
