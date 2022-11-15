//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

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
  Future<Response> callbackWithHttpInfo(OAuthCallbackDto oAuthCallbackDto,) async {
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
  Future<LoginResponseDto?> callback(OAuthCallbackDto oAuthCallbackDto,) async {
    final response = await callbackWithHttpInfo(oAuthCallbackDto,);
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

  /// Performs an HTTP 'POST /oauth/config' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [OAuthConfigDto] oAuthConfigDto (required):
  Future<Response> generateConfigWithHttpInfo(OAuthConfigDto oAuthConfigDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/oauth/config';

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
  Future<OAuthConfigResponseDto?> generateConfig(OAuthConfigDto oAuthConfigDto,) async {
    final response = await generateConfigWithHttpInfo(oAuthConfigDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'OAuthConfigResponseDto',) as OAuthConfigResponseDto;
    
    }
    return null;
  }
}
