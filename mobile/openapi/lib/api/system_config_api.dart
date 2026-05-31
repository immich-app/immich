// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class SystemConfigApi {
  SystemConfigApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getConfigAddedIn = .new(1, 0, 0);

  static const ApiState getConfigState = .stable;

  static const ApiVersion updateConfigAddedIn = .new(1, 0, 0);

  static const ApiState updateConfigState = .stable;

  static const ApiVersion getConfigDefaultsAddedIn = .new(1, 0, 0);

  static const ApiState getConfigDefaultsState = .stable;

  static const ApiVersion getStorageTemplateOptionsAddedIn = .new(1, 0, 0);

  static const ApiState getStorageTemplateOptionsState = .stable;

  /// Get system configuration
  ///
  /// Retrieve the current system configuration.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getConfigWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/system-config';

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

  /// Get system configuration
  ///
  /// Retrieve the current system configuration.
  ///
  /// Available since server v1.0.0.
  Future<SystemConfigDto> getConfig({Future<void>? abortTrigger}) async {
    final response = await getConfigWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'SystemConfigDto') as SystemConfigDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update system configuration
  ///
  /// Update the system configuration with a new system configuration.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateConfigWithHttpInfo(SystemConfigDto systemConfigDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/system-config';

    Object? postBody = systemConfigDto;

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

  /// Update system configuration
  ///
  /// Update the system configuration with a new system configuration.
  ///
  /// Available since server v1.0.0.
  Future<SystemConfigDto> updateConfig(SystemConfigDto systemConfigDto, {Future<void>? abortTrigger}) async {
    final response = await updateConfigWithHttpInfo(systemConfigDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'SystemConfigDto') as SystemConfigDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get system configuration defaults
  ///
  /// Retrieve the default values for the system configuration.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getConfigDefaultsWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/system-config/defaults';

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

  /// Get system configuration defaults
  ///
  /// Retrieve the default values for the system configuration.
  ///
  /// Available since server v1.0.0.
  Future<SystemConfigDto> getConfigDefaults({Future<void>? abortTrigger}) async {
    final response = await getConfigDefaultsWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'SystemConfigDto') as SystemConfigDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get storage template options
  ///
  /// Retrieve exemplary storage template options.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getStorageTemplateOptionsWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/system-config/storage-template-options';

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

  /// Get storage template options
  ///
  /// Retrieve exemplary storage template options.
  ///
  /// Available since server v1.0.0.
  Future<SystemConfigTemplateStorageOptionDto> getStorageTemplateOptions({Future<void>? abortTrigger}) async {
    final response = await getStorageTemplateOptionsWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'SystemConfigTemplateStorageOptionDto')
          as SystemConfigTemplateStorageOptionDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
