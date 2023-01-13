//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class APIKeyApi {
  APIKeyApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /api-key' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [APIKeyCreateDto] aPIKeyCreateDto (required):
  Future<Response> createKeyWithHttpInfo(APIKeyCreateDto aPIKeyCreateDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/api-key';

    // ignore: prefer_final_locals
    Object? postBody = aPIKeyCreateDto;

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
  /// * [APIKeyCreateDto] aPIKeyCreateDto (required):
  Future<APIKeyCreateResponseDto?> createKey(APIKeyCreateDto aPIKeyCreateDto,) async {
    final response = await createKeyWithHttpInfo(aPIKeyCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'APIKeyCreateResponseDto',) as APIKeyCreateResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'DELETE /api-key/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [num] id (required):
  Future<Response> deleteKeyWithHttpInfo(num id,) async {
    // ignore: prefer_const_declarations
    final path = r'/api-key/{id}'
      .replaceAll('{id}', id.toString());

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [num] id (required):
  Future<void> deleteKey(num id,) async {
    final response = await deleteKeyWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'GET /api-key/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [num] id (required):
  Future<Response> getKeyWithHttpInfo(num id,) async {
    // ignore: prefer_const_declarations
    final path = r'/api-key/{id}'
      .replaceAll('{id}', id.toString());

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

  /// Parameters:
  ///
  /// * [num] id (required):
  Future<APIKeyResponseDto?> getKey(num id,) async {
    final response = await getKeyWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'APIKeyResponseDto',) as APIKeyResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /api-key' operation and returns the [Response].
  Future<Response> getKeysWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/api-key';

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

  Future<List<APIKeyResponseDto>?> getKeys() async {
    final response = await getKeysWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<APIKeyResponseDto>') as List)
        .cast<APIKeyResponseDto>()
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'PUT /api-key/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [num] id (required):
  ///
  /// * [APIKeyUpdateDto] aPIKeyUpdateDto (required):
  Future<Response> updateKeyWithHttpInfo(num id, APIKeyUpdateDto aPIKeyUpdateDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/api-key/{id}'
      .replaceAll('{id}', id.toString());

    // ignore: prefer_final_locals
    Object? postBody = aPIKeyUpdateDto;

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
  /// * [num] id (required):
  ///
  /// * [APIKeyUpdateDto] aPIKeyUpdateDto (required):
  Future<APIKeyResponseDto?> updateKey(num id, APIKeyUpdateDto aPIKeyUpdateDto,) async {
    final response = await updateKeyWithHttpInfo(id, aPIKeyUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'APIKeyResponseDto',) as APIKeyResponseDto;
    
    }
    return null;
  }
}
