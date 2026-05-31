// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class ServerApi {
  ServerApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getAboutInfoAddedIn = .new(1, 0, 0);

  static const ApiState getAboutInfoState = .stable;

  static const ApiVersion getApkLinksAddedIn = .new(1, 0, 0);

  static const ApiState getApkLinksState = .stable;

  static const ApiVersion getServerConfigAddedIn = .new(1, 0, 0);

  static const ApiState getServerConfigState = .stable;

  static const ApiVersion getServerFeaturesAddedIn = .new(1, 0, 0);

  static const ApiState getServerFeaturesState = .stable;

  static const ApiVersion deleteServerLicenseAddedIn = .new(1, 0, 0);

  static const ApiState deleteServerLicenseState = .stable;

  static const ApiVersion getServerLicenseAddedIn = .new(1, 0, 0);

  static const ApiState getServerLicenseState = .stable;

  static const ApiVersion setServerLicenseAddedIn = .new(1, 0, 0);

  static const ApiState setServerLicenseState = .stable;

  static const ApiVersion getSupportedMediaTypesAddedIn = .new(1, 0, 0);

  static const ApiState getSupportedMediaTypesState = .stable;

  static const ApiVersion pingServerAddedIn = .new(1, 0, 0);

  static const ApiState pingServerState = .stable;

  static const ApiVersion getServerStatisticsAddedIn = .new(1, 0, 0);

  static const ApiState getServerStatisticsState = .stable;

  static const ApiVersion getStorageAddedIn = .new(1, 0, 0);

  static const ApiState getStorageState = .stable;

  static const ApiVersion getServerVersionAddedIn = .new(1, 0, 0);

  static const ApiState getServerVersionState = .stable;

  static const ApiVersion getVersionCheckAddedIn = .new(1, 0, 0);

  static const ApiState getVersionCheckState = .stable;

  static const ApiVersion getVersionHistoryAddedIn = .new(1, 0, 0);

  static const ApiState getVersionHistoryState = .stable;

  /// Get server information
  ///
  /// Retrieve a list of information about the server.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAboutInfoWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/server/about';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get server information
  ///
  /// Retrieve a list of information about the server.
  ///
  /// Available since server v1.0.0.
  Future<ServerAboutResponseDto> getAboutInfo({Future<void>? abortTrigger}) async {
    final response = await getAboutInfoWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ServerAboutResponseDto')
          as ServerAboutResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get APK links
  ///
  /// Retrieve links to the APKs for the current server version.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getApkLinksWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/server/apk-links';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get APK links
  ///
  /// Retrieve links to the APKs for the current server version.
  ///
  /// Available since server v1.0.0.
  Future<ServerApkLinksDto> getApkLinks({Future<void>? abortTrigger}) async {
    final response = await getApkLinksWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ServerApkLinksDto')
          as ServerApkLinksDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get config
  ///
  /// Retrieve the current server configuration.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getServerConfigWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/server/config';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get config
  ///
  /// Retrieve the current server configuration.
  ///
  /// Available since server v1.0.0.
  Future<ServerConfigDto> getServerConfig({Future<void>? abortTrigger}) async {
    final response = await getServerConfigWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ServerConfigDto') as ServerConfigDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get features
  ///
  /// Retrieve available features supported by this server.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getServerFeaturesWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/server/features';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get features
  ///
  /// Retrieve available features supported by this server.
  ///
  /// Available since server v1.0.0.
  Future<ServerFeaturesDto> getServerFeatures({Future<void>? abortTrigger}) async {
    final response = await getServerFeaturesWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ServerFeaturesDto')
          as ServerFeaturesDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete server product key
  ///
  /// Delete the currently set server product key.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteServerLicenseWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/server/license';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Delete server product key
  ///
  /// Delete the currently set server product key.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteServerLicense({Future<void>? abortTrigger}) async {
    final response = await deleteServerLicenseWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get product key
  ///
  /// Retrieve information about whether the server currently has a product key registered.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getServerLicenseWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/server/license';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get product key
  ///
  /// Retrieve information about whether the server currently has a product key registered.
  ///
  /// Available since server v1.0.0.
  Future<LicenseResponseDto> getServerLicense({Future<void>? abortTrigger}) async {
    final response = await getServerLicenseWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'LicenseResponseDto')
          as LicenseResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Set server product key
  ///
  /// Validate and set the server product key if successful.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> setServerLicenseWithHttpInfo(LicenseKeyDto licenseKeyDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/server/license';

    Object? postBody = licenseKeyDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Set server product key
  ///
  /// Validate and set the server product key if successful.
  ///
  /// Available since server v1.0.0.
  Future<LicenseResponseDto> setServerLicense(LicenseKeyDto licenseKeyDto, {Future<void>? abortTrigger}) async {
    final response = await setServerLicenseWithHttpInfo(licenseKeyDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'LicenseResponseDto')
          as LicenseResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get supported media types
  ///
  /// Retrieve all media types supported by the server.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getSupportedMediaTypesWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/server/media-types';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get supported media types
  ///
  /// Retrieve all media types supported by the server.
  ///
  /// Available since server v1.0.0.
  Future<ServerMediaTypesResponseDto> getSupportedMediaTypes({Future<void>? abortTrigger}) async {
    final response = await getSupportedMediaTypesWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ServerMediaTypesResponseDto')
          as ServerMediaTypesResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Ping
  ///
  /// Pong
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> pingServerWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/server/ping';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Ping
  ///
  /// Pong
  ///
  /// Available since server v1.0.0.
  Future<ServerPingResponse> pingServer({Future<void>? abortTrigger}) async {
    final response = await pingServerWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ServerPingResponse')
          as ServerPingResponse;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get statistics
  ///
  /// Retrieve statistics about the entire Immich instance such as asset counts.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getServerStatisticsWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/server/statistics';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get statistics
  ///
  /// Retrieve statistics about the entire Immich instance such as asset counts.
  ///
  /// Available since server v1.0.0.
  Future<ServerStatsResponseDto> getServerStatistics({Future<void>? abortTrigger}) async {
    final response = await getServerStatisticsWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ServerStatsResponseDto')
          as ServerStatsResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get storage
  ///
  /// Retrieve the current storage utilization information of the server.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getStorageWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/server/storage';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get storage
  ///
  /// Retrieve the current storage utilization information of the server.
  ///
  /// Available since server v1.0.0.
  Future<ServerStorageResponseDto> getStorage({Future<void>? abortTrigger}) async {
    final response = await getStorageWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ServerStorageResponseDto')
          as ServerStorageResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get server version
  ///
  /// Retrieve the current server version in semantic versioning (semver) format.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getServerVersionWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/server/version';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get server version
  ///
  /// Retrieve the current server version in semantic versioning (semver) format.
  ///
  /// Available since server v1.0.0.
  Future<ServerVersionResponseDto> getServerVersion({Future<void>? abortTrigger}) async {
    final response = await getServerVersionWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ServerVersionResponseDto')
          as ServerVersionResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get version check status
  ///
  /// Retrieve information about the last time the version check ran.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getVersionCheckWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/server/version-check';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get version check status
  ///
  /// Retrieve information about the last time the version check ran.
  ///
  /// Available since server v1.0.0.
  Future<VersionCheckStateResponseDto> getVersionCheck({Future<void>? abortTrigger}) async {
    final response = await getVersionCheckWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'VersionCheckStateResponseDto')
          as VersionCheckStateResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get version history
  ///
  /// Retrieve a list of past versions the server has been on.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getVersionHistoryWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/server/version-history';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Get version history
  ///
  /// Retrieve a list of past versions the server has been on.
  ///
  /// Available since server v1.0.0.
  Future<List<ServerVersionHistoryResponseDto>> getVersionHistory({Future<void>? abortTrigger}) async {
    final response = await getVersionHistoryWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<ServerVersionHistoryResponseDto>') as List)
          .cast<ServerVersionHistoryResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
