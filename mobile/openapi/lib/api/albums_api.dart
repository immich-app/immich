//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AlbumsApi {
  AlbumsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'PUT /albums/{id}/assets' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  ///
  /// * [String] key:
  Future<Response> addAssetsToAlbumWithHttpInfo(String id, BulkIdsDto bulkIdsDto, { String? key, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/albums/{id}/assets'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = bulkIdsDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
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

  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  ///
  /// * [String] key:
  Future<List<BulkIdResponseDto>?> addAssetsToAlbum(String id, BulkIdsDto bulkIdsDto, { String? key, }) async {
    final response = await addAssetsToAlbumWithHttpInfo(id, bulkIdsDto,  key: key, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<BulkIdResponseDto>') as List)
        .cast<BulkIdResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Performs an HTTP 'PUT /albums/{id}/users' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AddUsersDto] addUsersDto (required):
  Future<Response> addUsersToAlbumWithHttpInfo(String id, AddUsersDto addUsersDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/albums/{id}/users'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = addUsersDto;

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

  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AddUsersDto] addUsersDto (required):
  Future<AlbumResponseDto?> addUsersToAlbum(String id, AddUsersDto addUsersDto,) async {
    final response = await addUsersToAlbumWithHttpInfo(id, addUsersDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AlbumResponseDto',) as AlbumResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /albums' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [CreateAlbumDto] createAlbumDto (required):
  Future<Response> createAlbumWithHttpInfo(CreateAlbumDto createAlbumDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/albums';

    // ignore: prefer_final_locals
    Object? postBody = createAlbumDto;

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

  /// Parameters:
  ///
  /// * [CreateAlbumDto] createAlbumDto (required):
  Future<AlbumResponseDto?> createAlbum(CreateAlbumDto createAlbumDto,) async {
    final response = await createAlbumWithHttpInfo(createAlbumDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AlbumResponseDto',) as AlbumResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'DELETE /albums/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteAlbumWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/albums/{id}'
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

  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteAlbum(String id,) async {
    final response = await deleteAlbumWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'GET /albums/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [bool] withoutAssets:
  Future<Response> getAlbumInfoWithHttpInfo(String id, { String? key, bool? withoutAssets, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/albums/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }
    if (withoutAssets != null) {
      queryParams.addAll(_queryParams('', 'withoutAssets', withoutAssets));
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

  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [bool] withoutAssets:
  Future<AlbumResponseDto?> getAlbumInfo(String id, { String? key, bool? withoutAssets, }) async {
    final response = await getAlbumInfoWithHttpInfo(id,  key: key, withoutAssets: withoutAssets, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AlbumResponseDto',) as AlbumResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /albums/statistics' operation and returns the [Response].
  Future<Response> getAlbumStatisticsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/albums/statistics';

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

  Future<AlbumStatisticsResponseDto?> getAlbumStatistics() async {
    final response = await getAlbumStatisticsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AlbumStatisticsResponseDto',) as AlbumStatisticsResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /albums' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] assetId:
  ///   Only returns albums that contain the asset Ignores the shared parameter undefined: get all albums
  ///
  /// * [bool] shared:
  Future<Response> getAllAlbumsWithHttpInfo({ String? assetId, bool? shared, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/albums';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (assetId != null) {
      queryParams.addAll(_queryParams('', 'assetId', assetId));
    }
    if (shared != null) {
      queryParams.addAll(_queryParams('', 'shared', shared));
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

  /// Parameters:
  ///
  /// * [String] assetId:
  ///   Only returns albums that contain the asset Ignores the shared parameter undefined: get all albums
  ///
  /// * [bool] shared:
  Future<List<AlbumResponseDto>?> getAllAlbums({ String? assetId, bool? shared, }) async {
    final response = await getAllAlbumsWithHttpInfo( assetId: assetId, shared: shared, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AlbumResponseDto>') as List)
        .cast<AlbumResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Performs an HTTP 'DELETE /albums/{id}/assets' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  Future<Response> removeAssetFromAlbumWithHttpInfo(String id, BulkIdsDto bulkIdsDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/albums/{id}/assets'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = bulkIdsDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

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

  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  Future<List<BulkIdResponseDto>?> removeAssetFromAlbum(String id, BulkIdsDto bulkIdsDto,) async {
    final response = await removeAssetFromAlbumWithHttpInfo(id, bulkIdsDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<BulkIdResponseDto>') as List)
        .cast<BulkIdResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Performs an HTTP 'DELETE /albums/{id}/user/{userId}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] userId (required):
  Future<Response> removeUserFromAlbumWithHttpInfo(String id, String userId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/albums/{id}/user/{userId}'
      .replaceAll('{id}', id)
      .replaceAll('{userId}', userId);

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

  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] userId (required):
  Future<void> removeUserFromAlbum(String id, String userId,) async {
    final response = await removeUserFromAlbumWithHttpInfo(id, userId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'PATCH /albums/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateAlbumDto] updateAlbumDto (required):
  Future<Response> updateAlbumInfoWithHttpInfo(String id, UpdateAlbumDto updateAlbumDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/albums/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = updateAlbumDto;

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

  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateAlbumDto] updateAlbumDto (required):
  Future<AlbumResponseDto?> updateAlbumInfo(String id, UpdateAlbumDto updateAlbumDto,) async {
    final response = await updateAlbumInfoWithHttpInfo(id, updateAlbumDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AlbumResponseDto',) as AlbumResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'PUT /albums/{id}/user/{userId}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] userId (required):
  ///
  /// * [UpdateAlbumUserDto] updateAlbumUserDto (required):
  Future<Response> updateAlbumUserWithHttpInfo(String id, String userId, UpdateAlbumUserDto updateAlbumUserDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/albums/{id}/user/{userId}'
      .replaceAll('{id}', id)
      .replaceAll('{userId}', userId);

    // ignore: prefer_final_locals
    Object? postBody = updateAlbumUserDto;

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

  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] userId (required):
  ///
  /// * [UpdateAlbumUserDto] updateAlbumUserDto (required):
  Future<void> updateAlbumUser(String id, String userId, UpdateAlbumUserDto updateAlbumUserDto,) async {
    final response = await updateAlbumUserWithHttpInfo(id, userId, updateAlbumUserDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
