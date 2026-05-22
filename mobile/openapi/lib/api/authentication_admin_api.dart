//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AuthenticationAdminApi {
  AuthenticationAdminApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Unlink all OAuth accounts
  ///
  /// Unlinks all OAuth accounts associated with user accounts in the system.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> unlinkAllOAuthAccountsAdminWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/auth/unlink-all';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Unlink all OAuth accounts
  ///
  /// Unlinks all OAuth accounts associated with user accounts in the system.
  Future<void> unlinkAllOAuthAccountsAdmin() async {
    final response = await unlinkAllOAuthAccountsAdminWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
