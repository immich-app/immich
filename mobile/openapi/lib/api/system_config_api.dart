//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SystemConfigApi {
  SystemConfigApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'GET /system-config/ffmpeg' operation and returns the [Response].
  Future<Response> getFFmpegConfigWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/system-config/ffmpeg';

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

  Future<FFmpegSystemConfigResponseDto?> getFFmpegConfig() async {
    final response = await getFFmpegConfigWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'FFmpegSystemConfigResponseDto',) as FFmpegSystemConfigResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /system-config/oauth' operation and returns the [Response].
  Future<Response> getOAuthConfigWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/system-config/oauth';

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

  Future<OAuthSystemConfigResponseDto?> getOAuthConfig() async {
    final response = await getOAuthConfigWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'OAuthSystemConfigResponseDto',) as OAuthSystemConfigResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'PUT /system-config/ffmpeg' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [UpdateFFmpegSystemConfigDto] updateFFmpegSystemConfigDto (required):
  Future<Response> updateFFmpegConfigWithHttpInfo(UpdateFFmpegSystemConfigDto updateFFmpegSystemConfigDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/system-config/ffmpeg';

    // ignore: prefer_final_locals
    Object? postBody = updateFFmpegSystemConfigDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [UpdateFFmpegSystemConfigDto] updateFFmpegSystemConfigDto (required):
  Future<FFmpegSystemConfigResponseDto?> updateFFmpegConfig(UpdateFFmpegSystemConfigDto updateFFmpegSystemConfigDto,) async {
    final response = await updateFFmpegConfigWithHttpInfo(updateFFmpegSystemConfigDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'FFmpegSystemConfigResponseDto',) as FFmpegSystemConfigResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'PUT /system-config/oauth' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [UpdateOAuthSystemConfigDto] updateOAuthSystemConfigDto (required):
  Future<Response> updateOAuthConfigWithHttpInfo(UpdateOAuthSystemConfigDto updateOAuthSystemConfigDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/system-config/oauth';

    // ignore: prefer_final_locals
    Object? postBody = updateOAuthSystemConfigDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [UpdateOAuthSystemConfigDto] updateOAuthSystemConfigDto (required):
  Future<OAuthSystemConfigResponseDto?> updateOAuthConfig(UpdateOAuthSystemConfigDto updateOAuthSystemConfigDto,) async {
    final response = await updateOAuthConfigWithHttpInfo(updateOAuthSystemConfigDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'OAuthSystemConfigResponseDto',) as OAuthSystemConfigResponseDto;
    
    }
    return null;
  }
}
