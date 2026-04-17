//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class APIKeysApi {
  APIKeysApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create an API key
  ///
  /// Creates a new API key. It will be limited to the permissions specified.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [ApiKeyCreateDto] apiKeyCreateDto (required):
  Future<Response> createApiKeyWithHttpInfo(ApiKeyCreateDto apiKeyCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/api-keys';

    // ignore: prefer_final_locals
    Object? postBody = apiKeyCreateDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


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

  /// Create an API key
  ///
  /// Creates a new API key. It will be limited to the permissions specified.
  ///
  /// Parameters:
  ///
  /// * [ApiKeyCreateDto] apiKeyCreateDto (required):
  Future<ApiKeyCreateResponseDto?> createApiKey(ApiKeyCreateDto apiKeyCreateDto,) async {
    final response = await createApiKeyWithHttpInfo(apiKeyCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ApiKeyCreateResponseDto',) as ApiKeyCreateResponseDto;
    
    }
    return null;
  }

  /// Delete an API key
  ///
  /// Deletes an API key identified by its ID. The current user must own this API key.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteApiKeyWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/api-keys/{id}'
      .replaceAll('{id}', id);

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

  /// Delete an API key
  ///
  /// Deletes an API key identified by its ID. The current user must own this API key.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteApiKey(String id,) async {
    final response = await deleteApiKeyWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve an API key
  ///
  /// Retrieve an API key by its ID. The current user must own this API key.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getApiKeyWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/api-keys/{id}'
      .replaceAll('{id}', id);

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

  /// Retrieve an API key
  ///
  /// Retrieve an API key by its ID. The current user must own this API key.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<ApiKeyResponseDto?> getApiKey(String id,) async {
    final response = await getApiKeyWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ApiKeyResponseDto',) as ApiKeyResponseDto;
    
    }
    return null;
  }

  /// List all API keys
  ///
  /// Retrieve all API keys of the current user.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getApiKeysWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/api-keys';

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

  /// List all API keys
  ///
  /// Retrieve all API keys of the current user.
  Future<List<ApiKeyResponseDto>?> getApiKeys() async {
    final response = await getApiKeysWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<ApiKeyResponseDto>') as List)
        .cast<ApiKeyResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Retrieve the current API key
  ///
  /// Retrieve the API key that is used to access this endpoint.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getMyApiKeyWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/api-keys/me';

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

  /// Retrieve the current API key
  ///
  /// Retrieve the API key that is used to access this endpoint.
  Future<ApiKeyResponseDto?> getMyApiKey() async {
    final response = await getMyApiKeyWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ApiKeyResponseDto',) as ApiKeyResponseDto;
    
    }
    return null;
  }

  /// Update an API key
  ///
  /// Updates the name and permissions of an API key by its ID. The current user must own this API key.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [ApiKeyUpdateDto] apiKeyUpdateDto (required):
  Future<Response> updateApiKeyWithHttpInfo(String id, ApiKeyUpdateDto apiKeyUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/api-keys/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = apiKeyUpdateDto;

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

  /// Update an API key
  ///
  /// Updates the name and permissions of an API key by its ID. The current user must own this API key.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [ApiKeyUpdateDto] apiKeyUpdateDto (required):
  Future<ApiKeyResponseDto?> updateApiKey(String id, ApiKeyUpdateDto apiKeyUpdateDto,) async {
    final response = await updateApiKeyWithHttpInfo(id, apiKeyUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ApiKeyResponseDto',) as ApiKeyResponseDto;
    
    }
    return null;
  }
}
