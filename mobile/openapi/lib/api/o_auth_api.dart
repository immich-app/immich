//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class OAuthApi {
  OAuthApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /oauth/callback' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [OAuthCallbackDto] oAuthCallbackDto (required):
  Future<Response> finishOAuthWithHttpInfo(OAuthCallbackDto oAuthCallbackDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/oauth/callback';

    // ignore: prefer_final_locals
    Object? postBody = oAuthCallbackDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [OAuthCallbackDto] oAuthCallbackDto (required):
  Future<LoginResponseDto?> finishOAuth(OAuthCallbackDto oAuthCallbackDto,) async {
    final response = await finishOAuthWithHttpInfo(oAuthCallbackDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LoginResponseDto',) as LoginResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /oauth/link' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [OAuthCallbackDto] oAuthCallbackDto (required):
  Future<Response> linkOAuthAccountWithHttpInfo(OAuthCallbackDto oAuthCallbackDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/oauth/link';

    // ignore: prefer_final_locals
    Object? postBody = oAuthCallbackDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [OAuthCallbackDto] oAuthCallbackDto (required):
  Future<UserResponseDto?> linkOAuthAccount(OAuthCallbackDto oAuthCallbackDto,) async {
    final response = await linkOAuthAccountWithHttpInfo(oAuthCallbackDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserResponseDto',) as UserResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /oauth/mobile-redirect' operation and returns the [Response].
  Future<Response> redirectOAuthToMobileWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/oauth/mobile-redirect';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  Future<void> redirectOAuthToMobile() async {
    final response = await redirectOAuthToMobileWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'POST /oauth/authorize' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [OAuthConfigDto] oAuthConfigDto (required):
  Future<Response> startOAuthWithHttpInfo(OAuthConfigDto oAuthConfigDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/oauth/authorize';

    // ignore: prefer_final_locals
    Object? postBody = oAuthConfigDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [OAuthConfigDto] oAuthConfigDto (required):
  Future<OAuthAuthorizeResponseDto?> startOAuth(OAuthConfigDto oAuthConfigDto,) async {
    final response = await startOAuthWithHttpInfo(oAuthConfigDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'OAuthAuthorizeResponseDto',) as OAuthAuthorizeResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /oauth/unlink' operation and returns the [Response].
  Future<Response> unlinkOAuthAccountWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/oauth/unlink';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  Future<UserResponseDto?> unlinkOAuthAccount() async {
    final response = await unlinkOAuthAccountWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserResponseDto',) as UserResponseDto;
    
    }
    return null;
  }
}
