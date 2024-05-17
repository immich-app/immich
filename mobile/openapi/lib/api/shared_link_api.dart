//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SharedLinkApi {
  SharedLinkApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'PUT /shared-link/{id}/assets' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AssetIdsDto] assetIdsDto (required):
  ///
  /// * [String] key:
  Future<Response> addSharedLinkAssetsWithHttpInfo(String id, AssetIdsDto assetIdsDto, { String? key, }) async {
    // ignore: prefer_const_declarations
    final path = r'/shared-link/{id}/assets'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = assetIdsDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }

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
  /// * [String] id (required):
  ///
  /// * [AssetIdsDto] assetIdsDto (required):
  ///
  /// * [String] key:
  Future<List<AssetIdsResponseDto>?> addSharedLinkAssets(String id, AssetIdsDto assetIdsDto, { String? key, }) async {
    final response = await addSharedLinkAssetsWithHttpInfo(id, assetIdsDto,  key: key, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AssetIdsResponseDto>') as List)
        .cast<AssetIdsResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Performs an HTTP 'POST /shared-link' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [SharedLinkCreateDto] sharedLinkCreateDto (required):
  Future<Response> createSharedLinkWithHttpInfo(SharedLinkCreateDto sharedLinkCreateDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/shared-link';

    // ignore: prefer_final_locals
    Object? postBody = sharedLinkCreateDto;

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
  /// * [SharedLinkCreateDto] sharedLinkCreateDto (required):
  Future<SharedLinkResponseDto?> createSharedLink(SharedLinkCreateDto sharedLinkCreateDto,) async {
    final response = await createSharedLinkWithHttpInfo(sharedLinkCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SharedLinkResponseDto',) as SharedLinkResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /shared-link' operation and returns the [Response].
  Future<Response> getAllSharedLinksWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/shared-link';

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

  Future<List<SharedLinkResponseDto>?> getAllSharedLinks() async {
    final response = await getAllSharedLinksWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<SharedLinkResponseDto>') as List)
        .cast<SharedLinkResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Performs an HTTP 'GET /shared-link/me' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] key:
  ///
  /// * [String] password:
  ///
  /// * [String] token:
  Future<Response> getMySharedLinkWithHttpInfo({ String? key, String? password, String? token, }) async {
    // ignore: prefer_const_declarations
    final path = r'/shared-link/me';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }
    if (password != null) {
      queryParams.addAll(_queryParams('', 'password', password));
    }
    if (token != null) {
      queryParams.addAll(_queryParams('', 'token', token));
    }

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
  /// * [String] key:
  ///
  /// * [String] password:
  ///
  /// * [String] token:
  Future<SharedLinkResponseDto?> getMySharedLink({ String? key, String? password, String? token, }) async {
    final response = await getMySharedLinkWithHttpInfo( key: key, password: password, token: token, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SharedLinkResponseDto',) as SharedLinkResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /shared-link/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getSharedLinkByIdWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final path = r'/shared-link/{id}'
      .replaceAll('{id}', id);

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
  /// * [String] id (required):
  Future<SharedLinkResponseDto?> getSharedLinkById(String id,) async {
    final response = await getSharedLinkByIdWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SharedLinkResponseDto',) as SharedLinkResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'DELETE /shared-link/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> removeSharedLinkWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final path = r'/shared-link/{id}'
      .replaceAll('{id}', id);

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
  /// * [String] id (required):
  Future<void> removeSharedLink(String id,) async {
    final response = await removeSharedLinkWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'DELETE /shared-link/{id}/assets' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AssetIdsDto] assetIdsDto (required):
  ///
  /// * [String] key:
  Future<Response> removeSharedLinkAssetsWithHttpInfo(String id, AssetIdsDto assetIdsDto, { String? key, }) async {
    // ignore: prefer_const_declarations
    final path = r'/shared-link/{id}/assets'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = assetIdsDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }

    const contentTypes = <String>['application/json'];


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
  /// * [String] id (required):
  ///
  /// * [AssetIdsDto] assetIdsDto (required):
  ///
  /// * [String] key:
  Future<List<AssetIdsResponseDto>?> removeSharedLinkAssets(String id, AssetIdsDto assetIdsDto, { String? key, }) async {
    final response = await removeSharedLinkAssetsWithHttpInfo(id, assetIdsDto,  key: key, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AssetIdsResponseDto>') as List)
        .cast<AssetIdsResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Performs an HTTP 'PATCH /shared-link/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SharedLinkEditDto] sharedLinkEditDto (required):
  Future<Response> updateSharedLinkWithHttpInfo(String id, SharedLinkEditDto sharedLinkEditDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/shared-link/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = sharedLinkEditDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'PATCH',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SharedLinkEditDto] sharedLinkEditDto (required):
  Future<SharedLinkResponseDto?> updateSharedLink(String id, SharedLinkEditDto sharedLinkEditDto,) async {
    final response = await updateSharedLinkWithHttpInfo(id, sharedLinkEditDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SharedLinkResponseDto',) as SharedLinkResponseDto;
    
    }
    return null;
  }
}
