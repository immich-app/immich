//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SharedLinksApi {
  SharedLinksApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Add assets to a shared link
  ///
  /// Add assets to a specific shared link by its ID. This endpoint is only relevant for shared link of type individual.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AssetIdsDto] assetIdsDto (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> addSharedLinkAssetsWithHttpInfo(String id, AssetIdsDto assetIdsDto, { String? key, String? slug, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-links/{id}/assets'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = assetIdsDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
    }

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

  /// Add assets to a shared link
  ///
  /// Add assets to a specific shared link by its ID. This endpoint is only relevant for shared link of type individual.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AssetIdsDto] assetIdsDto (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<List<AssetIdsResponseDto>?> addSharedLinkAssets(String id, AssetIdsDto assetIdsDto, { String? key, String? slug, }) async {
    final response = await addSharedLinkAssetsWithHttpInfo(id, assetIdsDto,  key: key, slug: slug, );
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

  /// Create a shared link
  ///
  /// Create a new shared link.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [SharedLinkCreateDto] sharedLinkCreateDto (required):
  Future<Response> createSharedLinkWithHttpInfo(SharedLinkCreateDto sharedLinkCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-links';

    // ignore: prefer_final_locals
    Object? postBody = sharedLinkCreateDto;

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

  /// Create a shared link
  ///
  /// Create a new shared link.
  ///
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

  /// Retrieve all shared links
  ///
  /// Retrieve a list of all shared links.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] albumId:
  ///
  /// * [String] id:
  Future<Response> getAllSharedLinksWithHttpInfo({ String? albumId, String? id, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-links';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (albumId != null) {
      queryParams.addAll(_queryParams('', 'albumId', albumId));
    }
    if (id != null) {
      queryParams.addAll(_queryParams('', 'id', id));
    }

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

  /// Retrieve all shared links
  ///
  /// Retrieve a list of all shared links.
  ///
  /// Parameters:
  ///
  /// * [String] albumId:
  ///
  /// * [String] id:
  Future<List<SharedLinkResponseDto>?> getAllSharedLinks({ String? albumId, String? id, }) async {
    final response = await getAllSharedLinksWithHttpInfo( albumId: albumId, id: id, );
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

  /// Retrieve current shared link
  ///
  /// Retrieve the current shared link associated with authentication method.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] key:
  ///
  /// * [String] password:
  ///
  /// * [String] slug:
  ///
  /// * [String] token:
  Future<Response> getMySharedLinkWithHttpInfo({ String? key, String? password, String? slug, String? token, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-links/me';

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
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
    }
    if (token != null) {
      queryParams.addAll(_queryParams('', 'token', token));
    }

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

  /// Retrieve current shared link
  ///
  /// Retrieve the current shared link associated with authentication method.
  ///
  /// Parameters:
  ///
  /// * [String] key:
  ///
  /// * [String] password:
  ///
  /// * [String] slug:
  ///
  /// * [String] token:
  Future<SharedLinkResponseDto?> getMySharedLink({ String? key, String? password, String? slug, String? token, }) async {
    final response = await getMySharedLinkWithHttpInfo( key: key, password: password, slug: slug, token: token, );
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

  /// Retrieve a shared link
  ///
  /// Retrieve a specific shared link by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getSharedLinkByIdWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-links/{id}'
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

  /// Retrieve a shared link
  ///
  /// Retrieve a specific shared link by its ID.
  ///
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

  /// Delete a shared link
  ///
  /// Delete a specific shared link by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> removeSharedLinkWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-links/{id}'
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

  /// Delete a shared link
  ///
  /// Delete a specific shared link by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> removeSharedLink(String id,) async {
    final response = await removeSharedLinkWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Remove assets from a shared link
  ///
  /// Remove assets from a specific shared link by its ID. This endpoint is only relevant for shared link of type individual.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AssetIdsDto] assetIdsDto (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> removeSharedLinkAssetsWithHttpInfo(String id, AssetIdsDto assetIdsDto, { String? key, String? slug, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-links/{id}/assets'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = assetIdsDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
    }

    const contentTypes = <String>['application/json'];


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

  /// Remove assets from a shared link
  ///
  /// Remove assets from a specific shared link by its ID. This endpoint is only relevant for shared link of type individual.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AssetIdsDto] assetIdsDto (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<List<AssetIdsResponseDto>?> removeSharedLinkAssets(String id, AssetIdsDto assetIdsDto, { String? key, String? slug, }) async {
    final response = await removeSharedLinkAssetsWithHttpInfo(id, assetIdsDto,  key: key, slug: slug, );
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

  /// Update a shared link
  ///
  /// Update an existing shared link by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SharedLinkEditDto] sharedLinkEditDto (required):
  Future<Response> updateSharedLinkWithHttpInfo(String id, SharedLinkEditDto sharedLinkEditDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-links/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = sharedLinkEditDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      apiPath,
      'PATCH',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Update a shared link
  ///
  /// Update an existing shared link by its ID.
  ///
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
