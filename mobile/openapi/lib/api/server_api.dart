//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ServerApi {
  ServerApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Delete server product key
  ///
  /// Delete the currently set server product key.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteServerLicenseWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/license';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Delete server product key
  ///
  /// Delete the currently set server product key.
  Future<void> deleteServerLicense() async {
    final response = await deleteServerLicenseWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get server information
  ///
  /// Retrieve a list of information about the server.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAboutInfoWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/about';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get server information
  ///
  /// Retrieve a list of information about the server.
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

  /// Get APK links
  ///
  /// Retrieve links to the APKs for the current server version.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getApkLinksWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/apk-links';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get APK links
  ///
  /// Retrieve links to the APKs for the current server version.
  Future<ServerApkLinksDto?> getApkLinks() async {
    final response = await getApkLinksWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ServerApkLinksDto',) as ServerApkLinksDto;
    
    }
    return null;
  }

  /// Get config
  ///
  /// Retrieve the current server configuration.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getServerConfigWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/config';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get config
  ///
  /// Retrieve the current server configuration.
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

  /// Get features
  ///
  /// Retrieve available features supported by this server.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getServerFeaturesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/features';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get features
  ///
  /// Retrieve available features supported by this server.
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

  /// Get product key
  ///
  /// Retrieve information about whether the server currently has a product key registered.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getServerLicenseWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/license';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get product key
  ///
  /// Retrieve information about whether the server currently has a product key registered.
  Future<LicenseResponseDto?> getServerLicense() async {
    final response = await getServerLicenseWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LicenseResponseDto',) as LicenseResponseDto;
    
    }
    return null;
  }

  /// Get statistics
  ///
  /// Retrieve statistics about the entire Immich instance such as asset counts.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getServerStatisticsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/statistics';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get statistics
  ///
  /// Retrieve statistics about the entire Immich instance such as asset counts.
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

  /// Get server version
  ///
  /// Retrieve the current server version in semantic versioning (semver) format.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getServerVersionWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/version';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get server version
  ///
  /// Retrieve the current server version in semantic versioning (semver) format.
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

  /// Get storage
  ///
  /// Retrieve the current storage utilization information of the server.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getStorageWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/storage';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get storage
  ///
  /// Retrieve the current storage utilization information of the server.
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

  /// Get supported media types
  ///
  /// Retrieve all media types supported by the server.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getSupportedMediaTypesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/media-types';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get supported media types
  ///
  /// Retrieve all media types supported by the server.
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

  /// Get theme
  ///
  /// Retrieve the custom CSS, if existent.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getThemeWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/theme';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get theme
  ///
  /// Retrieve the custom CSS, if existent.
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

  /// Get version check status
  ///
  /// Retrieve information about the last time the version check ran.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getVersionCheckWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/version-check';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get version check status
  ///
  /// Retrieve information about the last time the version check ran.
  Future<VersionCheckStateResponseDto?> getVersionCheck() async {
    final response = await getVersionCheckWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'VersionCheckStateResponseDto',) as VersionCheckStateResponseDto;
    
    }
    return null;
  }

  /// Get version history
  ///
  /// Retrieve a list of past versions the server has been on.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getVersionHistoryWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/version-history';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get version history
  ///
  /// Retrieve a list of past versions the server has been on.
  Future<List<ServerVersionHistoryResponseDto>?> getVersionHistory() async {
    final response = await getVersionHistoryWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<ServerVersionHistoryResponseDto>') as List)
        .cast<ServerVersionHistoryResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Ping
  ///
  /// Pong
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> pingServerWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/ping';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Ping
  ///
  /// Pong
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

  /// Set server product key
  ///
  /// Validate and set the server product key if successful.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [LicenseKeyDto] licenseKeyDto (required):
  Future<Response> setServerLicenseWithHttpInfo(LicenseKeyDto licenseKeyDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/server/license';

    // ignore: prefer_final_locals
    Object? postBody = licenseKeyDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      apiPath,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Set server product key
  ///
  /// Validate and set the server product key if successful.
  ///
  /// Parameters:
  ///
  /// * [LicenseKeyDto] licenseKeyDto (required):
  Future<LicenseResponseDto?> setServerLicense(LicenseKeyDto licenseKeyDto,) async {
    final response = await setServerLicenseWithHttpInfo(licenseKeyDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LicenseResponseDto',) as LicenseResponseDto;
    
    }
    return null;
  }
}
