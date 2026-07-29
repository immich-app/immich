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

  /// Add assets to an album
  ///
  /// Add multiple assets to a specific album by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  Future<Response> addAssetsToAlbumWithHttpInfo(String id, BulkIdsDto bulkIdsDto, { Future<void>? abortTrigger, }) async {
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
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Add assets to an album
  ///
  /// Add multiple assets to a specific album by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  Future<List<BulkIdResponseDto>?> addAssetsToAlbum(String id, BulkIdsDto bulkIdsDto, { Future<void>? abortTrigger, }) async {
    final response = await addAssetsToAlbumWithHttpInfo(id, bulkIdsDto, abortTrigger: abortTrigger,);
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

  /// Add assets to albums
  ///
  /// Send a list of asset IDs and album IDs to add each asset to each album.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [AlbumsAddAssetsDto] albumsAddAssetsDto (required):
  Future<Response> addAssetsToAlbumsWithHttpInfo(AlbumsAddAssetsDto albumsAddAssetsDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/albums/assets';

    // ignore: prefer_final_locals
    Object? postBody = albumsAddAssetsDto;

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
      abortTrigger: abortTrigger,
    );
  }

  /// Add assets to albums
  ///
  /// Send a list of asset IDs and album IDs to add each asset to each album.
  ///
  /// Parameters:
  ///
  /// * [AlbumsAddAssetsDto] albumsAddAssetsDto (required):
  Future<AlbumsAddAssetsResponseDto?> addAssetsToAlbums(AlbumsAddAssetsDto albumsAddAssetsDto, { Future<void>? abortTrigger, }) async {
    final response = await addAssetsToAlbumsWithHttpInfo(albumsAddAssetsDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AlbumsAddAssetsResponseDto',) as AlbumsAddAssetsResponseDto;
    
    }
    return null;
  }

  /// Share album with users
  ///
  /// Share an album with multiple users. Each user can be given a specific role in the album.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AddUsersDto] addUsersDto (required):
  Future<Response> addUsersToAlbumWithHttpInfo(String id, AddUsersDto addUsersDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Share album with users
  ///
  /// Share an album with multiple users. Each user can be given a specific role in the album.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AddUsersDto] addUsersDto (required):
  Future<AlbumResponseDto?> addUsersToAlbum(String id, AddUsersDto addUsersDto, { Future<void>? abortTrigger, }) async {
    final response = await addUsersToAlbumWithHttpInfo(id, addUsersDto, abortTrigger: abortTrigger,);
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

  /// Create an album
  ///
  /// Create a new album. The album can also be created with initial users and assets.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [CreateAlbumDto] createAlbumDto (required):
  Future<Response> createAlbumWithHttpInfo(CreateAlbumDto createAlbumDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Create an album
  ///
  /// Create a new album. The album can also be created with initial users and assets.
  ///
  /// Parameters:
  ///
  /// * [CreateAlbumDto] createAlbumDto (required):
  Future<AlbumResponseDto?> createAlbum(CreateAlbumDto createAlbumDto, { Future<void>? abortTrigger, }) async {
    final response = await createAlbumWithHttpInfo(createAlbumDto, abortTrigger: abortTrigger,);
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

  /// Delete an album
  ///
  /// Delete a specific album by its ID. Note the album is initially trashed and then immediately scheduled for deletion, but relies on a background job to complete the process.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteAlbumWithHttpInfo(String id, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Delete an album
  ///
  /// Delete a specific album by its ID. Note the album is initially trashed and then immediately scheduled for deletion, but relies on a background job to complete the process.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteAlbum(String id, { Future<void>? abortTrigger, }) async {
    final response = await deleteAlbumWithHttpInfo(id, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve an album
  ///
  /// Retrieve information about a specific album by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> getAlbumInfoWithHttpInfo(String id, { String? key, String? slug, Future<void>? abortTrigger, }) async {
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
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
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
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve an album
  ///
  /// Retrieve information about a specific album by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<AlbumResponseDto?> getAlbumInfo(String id, { String? key, String? slug, Future<void>? abortTrigger, }) async {
    final response = await getAlbumInfoWithHttpInfo(id, key: key, slug: slug, abortTrigger: abortTrigger,);
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

  /// Retrieve album map markers
  ///
  /// Retrieve map marker information for a specific album by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> getAlbumMapMarkersWithHttpInfo(String id, { String? key, String? slug, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/albums/{id}/map-markers'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
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
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve album map markers
  ///
  /// Retrieve map marker information for a specific album by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<List<MapMarkerResponseDto>?> getAlbumMapMarkers(String id, { String? key, String? slug, Future<void>? abortTrigger, }) async {
    final response = await getAlbumMapMarkersWithHttpInfo(id, key: key, slug: slug, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<MapMarkerResponseDto>') as List)
        .cast<MapMarkerResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Retrieve album statistics
  ///
  /// Returns statistics about the albums available to the authenticated user.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAlbumStatisticsWithHttpInfo({ Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve album statistics
  ///
  /// Returns statistics about the albums available to the authenticated user.
  Future<AlbumStatisticsResponseDto?> getAlbumStatistics({ Future<void>? abortTrigger, }) async {
    final response = await getAlbumStatisticsWithHttpInfo(abortTrigger: abortTrigger,);
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

  /// List all albums
  ///
  /// Retrieve a list of albums available to the authenticated user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] assetId:
  ///   Filter albums containing this asset ID (ignores other parameters)
  ///
  /// * [String] id:
  ///   Album ID
  ///
  /// * [bool] isOwned:
  ///   Filter by ownership: true = only owned, false = only shared-with-me, undefined = no filter
  ///
  /// * [bool] isShared:
  ///   Filter by shared status: true = only shared, false = not shared, undefined = no filter
  ///
  /// * [String] name:
  ///   Album name (exact match)
  Future<Response> getAllAlbumsWithHttpInfo({ String? assetId, String? id, bool? isOwned, bool? isShared, String? name, Future<void>? abortTrigger, }) async {
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
    if (id != null) {
      queryParams.addAll(_queryParams('', 'id', id));
    }
    if (isOwned != null) {
      queryParams.addAll(_queryParams('', 'isOwned', isOwned));
    }
    if (isShared != null) {
      queryParams.addAll(_queryParams('', 'isShared', isShared));
    }
    if (name != null) {
      queryParams.addAll(_queryParams('', 'name', name));
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
      abortTrigger: abortTrigger,
    );
  }

  /// List all albums
  ///
  /// Retrieve a list of albums available to the authenticated user.
  ///
  /// Parameters:
  ///
  /// * [String] assetId:
  ///   Filter albums containing this asset ID (ignores other parameters)
  ///
  /// * [String] id:
  ///   Album ID
  ///
  /// * [bool] isOwned:
  ///   Filter by ownership: true = only owned, false = only shared-with-me, undefined = no filter
  ///
  /// * [bool] isShared:
  ///   Filter by shared status: true = only shared, false = not shared, undefined = no filter
  ///
  /// * [String] name:
  ///   Album name (exact match)
  Future<List<AlbumResponseDto>?> getAllAlbums({ String? assetId, String? id, bool? isOwned, bool? isShared, String? name, Future<void>? abortTrigger, }) async {
    final response = await getAllAlbumsWithHttpInfo(assetId: assetId, id: id, isOwned: isOwned, isShared: isShared, name: name, abortTrigger: abortTrigger,);
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

  /// Remove assets from an album
  ///
  /// Remove multiple assets from a specific album by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  Future<Response> removeAssetFromAlbumWithHttpInfo(String id, BulkIdsDto bulkIdsDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Remove assets from an album
  ///
  /// Remove multiple assets from a specific album by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  Future<List<BulkIdResponseDto>?> removeAssetFromAlbum(String id, BulkIdsDto bulkIdsDto, { Future<void>? abortTrigger, }) async {
    final response = await removeAssetFromAlbumWithHttpInfo(id, bulkIdsDto, abortTrigger: abortTrigger,);
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

  /// Remove user from album
  ///
  /// Remove a user from an album. Use an ID of \"me\" to leave a shared album.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///   Album ID
  ///
  /// * [String] userId (required):
  ///   Album user ID, or \"me\" to reference the current user.
  Future<Response> removeUserFromAlbumWithHttpInfo(String id, String userId, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Remove user from album
  ///
  /// Remove a user from an album. Use an ID of \"me\" to leave a shared album.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///   Album ID
  ///
  /// * [String] userId (required):
  ///   Album user ID, or \"me\" to reference the current user.
  Future<void> removeUserFromAlbum(String id, String userId, { Future<void>? abortTrigger, }) async {
    final response = await removeUserFromAlbumWithHttpInfo(id, userId, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Update an album
  ///
  /// Update the information of a specific album by its ID. This endpoint can be used to update the album name, description, sort order, etc. However, it is not used to add or remove assets or users from the album.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateAlbumDto] updateAlbumDto (required):
  Future<Response> updateAlbumInfoWithHttpInfo(String id, UpdateAlbumDto updateAlbumDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Update an album
  ///
  /// Update the information of a specific album by its ID. This endpoint can be used to update the album name, description, sort order, etc. However, it is not used to add or remove assets or users from the album.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateAlbumDto] updateAlbumDto (required):
  Future<AlbumResponseDto?> updateAlbumInfo(String id, UpdateAlbumDto updateAlbumDto, { Future<void>? abortTrigger, }) async {
    final response = await updateAlbumInfoWithHttpInfo(id, updateAlbumDto, abortTrigger: abortTrigger,);
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

  /// Update user role
  ///
  /// Change the role for a specific user in a specific album.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///   Album ID
  ///
  /// * [String] userId (required):
  ///   Album user ID, or \"me\" to reference the current user.
  ///
  /// * [UpdateAlbumUserDto] updateAlbumUserDto (required):
  Future<Response> updateAlbumUserWithHttpInfo(String id, String userId, UpdateAlbumUserDto updateAlbumUserDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Update user role
  ///
  /// Change the role for a specific user in a specific album.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///   Album ID
  ///
  /// * [String] userId (required):
  ///   Album user ID, or \"me\" to reference the current user.
  ///
  /// * [UpdateAlbumUserDto] updateAlbumUserDto (required):
  Future<void> updateAlbumUser(String id, String userId, UpdateAlbumUserDto updateAlbumUserDto, { Future<void>? abortTrigger, }) async {
    final response = await updateAlbumUserWithHttpInfo(id, userId, updateAlbumUserDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
