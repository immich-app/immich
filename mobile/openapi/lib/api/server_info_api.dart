//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ServerInfoApi {
  ServerInfoApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// This property was deprecated in v1.107.0
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAboutInfoWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/server-info/about';

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

  /// This property was deprecated in v1.107.0
  Future<ServerAboutResponseDto?> getAboutInfo() async {
    final response = await getAboutInfoWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ServerAboutResponseDto',) as ServerAboutResponseDto;
    
    }
    return null;
  }

  /// This property was deprecated in v1.107.0
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getServerConfigWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/server-info/config';

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

  /// This property was deprecated in v1.107.0
  Future<ServerConfigDto?> getServerConfig() async {
    final response = await getServerConfigWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ServerConfigDto',) as ServerConfigDto;
    
    }
    return null;
  }

  /// This property was deprecated in v1.107.0
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getServerFeaturesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/server-info/features';

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

  /// This property was deprecated in v1.107.0
  Future<ServerFeaturesDto?> getServerFeatures() async {
    final response = await getServerFeaturesWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ServerFeaturesDto',) as ServerFeaturesDto;
    
    }
    return null;
  }

  /// This property was deprecated in v1.107.0
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getServerStatisticsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/server-info/statistics';

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

  /// This property was deprecated in v1.107.0
  Future<ServerStatsResponseDto?> getServerStatistics() async {
    final response = await getServerStatisticsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ServerStatsResponseDto',) as ServerStatsResponseDto;
    
    }
    return null;
  }

  /// This property was deprecated in v1.107.0
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getServerVersionWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/server-info/version';

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

  /// This property was deprecated in v1.107.0
  Future<ServerVersionResponseDto?> getServerVersion() async {
    final response = await getServerVersionWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ServerVersionResponseDto',) as ServerVersionResponseDto;
    
    }
    return null;
  }

  /// This property was deprecated in v1.107.0
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getStorageWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/server-info/storage';

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

  /// This property was deprecated in v1.107.0
  Future<ServerStorageResponseDto?> getStorage() async {
    final response = await getStorageWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ServerStorageResponseDto',) as ServerStorageResponseDto;
    
    }
    return null;
  }

  /// This property was deprecated in v1.107.0
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getSupportedMediaTypesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/server-info/media-types';

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

  /// This property was deprecated in v1.107.0
  Future<ServerMediaTypesResponseDto?> getSupportedMediaTypes() async {
    final response = await getSupportedMediaTypesWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ServerMediaTypesResponseDto',) as ServerMediaTypesResponseDto;
    
    }
    return null;
  }

  /// This property was deprecated in v1.107.0
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getThemeWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/server-info/theme';

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

  /// This property was deprecated in v1.107.0
  Future<ServerThemeDto?> getTheme() async {
    final response = await getThemeWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ServerThemeDto',) as ServerThemeDto;
    
    }
    return null;
  }

  /// This property was deprecated in v1.107.0
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> pingServerWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/server-info/ping';

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

  /// This property was deprecated in v1.107.0
  Future<ServerPingResponse?> pingServer() async {
    final response = await pingServerWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ServerPingResponse',) as ServerPingResponse;
    
    }
    return null;
  }
}
