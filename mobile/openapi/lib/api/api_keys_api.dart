// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class ApiKeysApi {
  ApiKeysApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getApiKeysAddedIn = .new(1, 0, 0);

  static const ApiState getApiKeysState = .stable;

  static const ApiVersion createApiKeyAddedIn = .new(1, 0, 0);

  static const ApiState createApiKeyState = .stable;

  static const ApiVersion getMyApiKeyAddedIn = .new(1, 0, 0);

  static const ApiState getMyApiKeyState = .stable;

  static const ApiVersion deleteApiKeyAddedIn = .new(1, 0, 0);

  static const ApiState deleteApiKeyState = .stable;

  static const ApiVersion getApiKeyAddedIn = .new(1, 0, 0);

  static const ApiState getApiKeyState = .stable;

  static const ApiVersion updateApiKeyAddedIn = .new(1, 0, 0);

  static const ApiState updateApiKeyState = .stable;

  /// List all API keys
  ///
  /// Retrieve all API keys of the current user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getApiKeysWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/api-keys';

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

  /// List all API keys
  ///
  /// Retrieve all API keys of the current user.
  ///
  /// Available since server v1.0.0.
  Future<List<ApiKeyResponseDto>> getApiKeys({Future<void>? abortTrigger}) async {
    final response = await getApiKeysWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<ApiKeyResponseDto>') as List)
          .cast<ApiKeyResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create an API key
  ///
  /// Creates a new API key. It will be limited to the permissions specified.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createApiKeyWithHttpInfo(ApiKeyCreateDto apiKeyCreateDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/api-keys';

    Object? postBody = apiKeyCreateDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

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

  /// Create an API key
  ///
  /// Creates a new API key. It will be limited to the permissions specified.
  ///
  /// Available since server v1.0.0.
  Future<ApiKeyCreateResponseDto> createApiKey(ApiKeyCreateDto apiKeyCreateDto, {Future<void>? abortTrigger}) async {
    final response = await createApiKeyWithHttpInfo(apiKeyCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ApiKeyCreateResponseDto')
          as ApiKeyCreateResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve the current API key
  ///
  /// Retrieve the API key that is used to access this endpoint.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getMyApiKeyWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/api-keys/me';

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

  /// Retrieve the current API key
  ///
  /// Retrieve the API key that is used to access this endpoint.
  ///
  /// Available since server v1.0.0.
  Future<ApiKeyResponseDto> getMyApiKey({Future<void>? abortTrigger}) async {
    final response = await getMyApiKeyWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ApiKeyResponseDto')
          as ApiKeyResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete an API key
  ///
  /// Deletes an API key identified by its ID. The current user must own this API key.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteApiKeyWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/api-keys/{id}'.replaceAll('{id}', id);

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

  /// Delete an API key
  ///
  /// Deletes an API key identified by its ID. The current user must own this API key.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteApiKey(String id, {Future<void>? abortTrigger}) async {
    final response = await deleteApiKeyWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve an API key
  ///
  /// Retrieve an API key by its ID. The current user must own this API key.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getApiKeyWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/api-keys/{id}'.replaceAll('{id}', id);

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

  /// Retrieve an API key
  ///
  /// Retrieve an API key by its ID. The current user must own this API key.
  ///
  /// Available since server v1.0.0.
  Future<ApiKeyResponseDto> getApiKey(String id, {Future<void>? abortTrigger}) async {
    final response = await getApiKeyWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ApiKeyResponseDto')
          as ApiKeyResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update an API key
  ///
  /// Updates the name and permissions of an API key by its ID. The current user must own this API key.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateApiKeyWithHttpInfo(
    String id,
    ApiKeyUpdateDto apiKeyUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/api-keys/{id}'.replaceAll('{id}', id);

    Object? postBody = apiKeyUpdateDto;

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

  /// Update an API key
  ///
  /// Updates the name and permissions of an API key by its ID. The current user must own this API key.
  ///
  /// Available since server v1.0.0.
  Future<ApiKeyResponseDto> updateApiKey(
    String id,
    ApiKeyUpdateDto apiKeyUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateApiKeyWithHttpInfo(id, apiKeyUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ApiKeyResponseDto')
          as ApiKeyResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
