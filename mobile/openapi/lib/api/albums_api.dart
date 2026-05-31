// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class AlbumsApi {
  AlbumsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getAllAlbumsAddedIn = .new(1, 0, 0);

  static const ApiState getAllAlbumsState = .stable;

  static const ApiVersion createAlbumAddedIn = .new(1, 0, 0);

  static const ApiState createAlbumState = .stable;

  static const ApiVersion addAssetsToAlbumsAddedIn = .new(1, 0, 0);

  static const ApiState addAssetsToAlbumsState = .stable;

  static const ApiVersion getAlbumStatisticsAddedIn = .new(1, 0, 0);

  static const ApiState getAlbumStatisticsState = .stable;

  static const ApiVersion deleteAlbumAddedIn = .new(1, 0, 0);

  static const ApiState deleteAlbumState = .stable;

  static const ApiVersion getAlbumInfoAddedIn = .new(1, 0, 0);

  static const ApiState getAlbumInfoState = .stable;

  static const ApiVersion updateAlbumInfoAddedIn = .new(1, 0, 0);

  static const ApiState updateAlbumInfoState = .stable;

  static const ApiVersion removeAssetFromAlbumAddedIn = .new(1, 0, 0);

  static const ApiState removeAssetFromAlbumState = .stable;

  static const ApiVersion addAssetsToAlbumAddedIn = .new(1, 0, 0);

  static const ApiState addAssetsToAlbumState = .stable;

  static const ApiVersion getAlbumMapMarkersAddedIn = .new(3, 0, 0);

  static const ApiState getAlbumMapMarkersState = .added;

  static const ApiVersion removeUserFromAlbumAddedIn = .new(1, 0, 0);

  static const ApiState removeUserFromAlbumState = .stable;

  static const ApiVersion updateAlbumUserAddedIn = .new(1, 0, 0);

  static const ApiState updateAlbumUserState = .stable;

  static const ApiVersion addUsersToAlbumAddedIn = .new(1, 0, 0);

  static const ApiState addUsersToAlbumState = .stable;

  /// List all albums
  ///
  /// Retrieve a list of albums available to the authenticated user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAllAlbumsWithHttpInfo({
    String? assetId,
    String? id,
    bool? isOwned,
    bool? isShared,
    String? name,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/albums';

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
      r'GET',
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
  /// Available since server v1.0.0.
  Future<List<AlbumResponseDto>> getAllAlbums({
    String? assetId,
    String? id,
    bool? isOwned,
    bool? isShared,
    String? name,
    Future<void>? abortTrigger,
  }) async {
    final response = await getAllAlbumsWithHttpInfo(
      assetId: assetId,
      id: id,
      isOwned: isOwned,
      isShared: isShared,
      name: name,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<AlbumResponseDto>') as List)
          .cast<AlbumResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create an album
  ///
  /// Create a new album. The album can also be created with initial users and assets.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createAlbumWithHttpInfo(CreateAlbumDto createAlbumDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/albums';

    Object? postBody = createAlbumDto;

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

  /// Create an album
  ///
  /// Create a new album. The album can also be created with initial users and assets.
  ///
  /// Available since server v1.0.0.
  Future<AlbumResponseDto> createAlbum(CreateAlbumDto createAlbumDto, {Future<void>? abortTrigger}) async {
    final response = await createAlbumWithHttpInfo(createAlbumDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AlbumResponseDto')
          as AlbumResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Add assets to albums
  ///
  /// Send a list of asset IDs and album IDs to add each asset to each album.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> addAssetsToAlbumsWithHttpInfo(
    AlbumsAddAssetsDto albumsAddAssetsDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/albums/assets';

    Object? postBody = albumsAddAssetsDto;

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

  /// Add assets to albums
  ///
  /// Send a list of asset IDs and album IDs to add each asset to each album.
  ///
  /// Available since server v1.0.0.
  Future<AlbumsAddAssetsResponseDto> addAssetsToAlbums(
    AlbumsAddAssetsDto albumsAddAssetsDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await addAssetsToAlbumsWithHttpInfo(albumsAddAssetsDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AlbumsAddAssetsResponseDto')
          as AlbumsAddAssetsResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve album statistics
  ///
  /// Returns statistics about the albums available to the authenticated user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAlbumStatisticsWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/albums/statistics';

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

  /// Retrieve album statistics
  ///
  /// Returns statistics about the albums available to the authenticated user.
  ///
  /// Available since server v1.0.0.
  Future<AlbumStatisticsResponseDto> getAlbumStatistics({Future<void>? abortTrigger}) async {
    final response = await getAlbumStatisticsWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AlbumStatisticsResponseDto')
          as AlbumStatisticsResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete an album
  ///
  /// Delete a specific album by its ID. Note the album is initially trashed and then immediately scheduled for deletion, but relies on a background job to complete the process.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteAlbumWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/albums/{id}'.replaceAll('{id}', id);

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

  /// Delete an album
  ///
  /// Delete a specific album by its ID. Note the album is initially trashed and then immediately scheduled for deletion, but relies on a background job to complete the process.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteAlbum(String id, {Future<void>? abortTrigger}) async {
    final response = await deleteAlbumWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve an album
  ///
  /// Retrieve information about a specific album by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAlbumInfoWithHttpInfo(String id, {String? key, String? slug, Future<void>? abortTrigger}) async {
    final apiPath = r'/albums/{id}'.replaceAll('{id}', id);

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
      r'GET',
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
  /// Available since server v1.0.0.
  Future<AlbumResponseDto> getAlbumInfo(String id, {String? key, String? slug, Future<void>? abortTrigger}) async {
    final response = await getAlbumInfoWithHttpInfo(id, key: key, slug: slug, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AlbumResponseDto')
          as AlbumResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update an album
  ///
  /// Update the information of a specific album by its ID. This endpoint can be used to update the album name, description, sort order, etc. However, it is not used to add or remove assets or users from the album.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateAlbumInfoWithHttpInfo(
    String id,
    UpdateAlbumDto updateAlbumDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/albums/{id}'.replaceAll('{id}', id);

    Object? postBody = updateAlbumDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'PATCH',
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
  /// Available since server v1.0.0.
  Future<AlbumResponseDto> updateAlbumInfo(
    String id,
    UpdateAlbumDto updateAlbumDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateAlbumInfoWithHttpInfo(id, updateAlbumDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AlbumResponseDto')
          as AlbumResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Remove assets from an album
  ///
  /// Remove multiple assets from a specific album by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> removeAssetFromAlbumWithHttpInfo(
    String id,
    BulkIdsDto bulkIdsDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/albums/{id}/assets'.replaceAll('{id}', id);

    Object? postBody = bulkIdsDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

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

  /// Remove assets from an album
  ///
  /// Remove multiple assets from a specific album by its ID.
  ///
  /// Available since server v1.0.0.
  Future<List<BulkIdResponseDto>> removeAssetFromAlbum(
    String id,
    BulkIdsDto bulkIdsDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await removeAssetFromAlbumWithHttpInfo(id, bulkIdsDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<BulkIdResponseDto>') as List)
          .cast<BulkIdResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Add assets to an album
  ///
  /// Add multiple assets to a specific album by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> addAssetsToAlbumWithHttpInfo(String id, BulkIdsDto bulkIdsDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/albums/{id}/assets'.replaceAll('{id}', id);

    Object? postBody = bulkIdsDto;

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

  /// Add assets to an album
  ///
  /// Add multiple assets to a specific album by its ID.
  ///
  /// Available since server v1.0.0.
  Future<List<BulkIdResponseDto>> addAssetsToAlbum(
    String id,
    BulkIdsDto bulkIdsDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await addAssetsToAlbumWithHttpInfo(id, bulkIdsDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<BulkIdResponseDto>') as List)
          .cast<BulkIdResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve album map markers
  ///
  /// Retrieve map marker information for a specific album by its ID.
  ///
  /// Available since server v3.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAlbumMapMarkersWithHttpInfo(
    String id, {
    String? key,
    String? slug,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/albums/{id}/map-markers'.replaceAll('{id}', id);

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
      r'GET',
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
  /// Available since server v3.0.0.
  Future<List<MapMarkerResponseDto>> getAlbumMapMarkers(
    String id, {
    String? key,
    String? slug,
    Future<void>? abortTrigger,
  }) async {
    final response = await getAlbumMapMarkersWithHttpInfo(id, key: key, slug: slug, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<MapMarkerResponseDto>') as List)
          .cast<MapMarkerResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Remove user from album
  ///
  /// Remove a user from an album. Use an ID of "me" to leave a shared album.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> removeUserFromAlbumWithHttpInfo(String id, String userId, {Future<void>? abortTrigger}) async {
    final apiPath = r'/albums/{id}/user/{userId}'.replaceAll('{id}', id).replaceAll('{userId}', userId);

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

  /// Remove user from album
  ///
  /// Remove a user from an album. Use an ID of "me" to leave a shared album.
  ///
  /// Available since server v1.0.0.
  Future<void> removeUserFromAlbum(String id, String userId, {Future<void>? abortTrigger}) async {
    final response = await removeUserFromAlbumWithHttpInfo(id, userId, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Update user role
  ///
  /// Change the role for a specific user in a specific album.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateAlbumUserWithHttpInfo(
    String id,
    String userId,
    UpdateAlbumUserDto updateAlbumUserDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/albums/{id}/user/{userId}'.replaceAll('{id}', id).replaceAll('{userId}', userId);

    Object? postBody = updateAlbumUserDto;

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

  /// Update user role
  ///
  /// Change the role for a specific user in a specific album.
  ///
  /// Available since server v1.0.0.
  Future<void> updateAlbumUser(
    String id,
    String userId,
    UpdateAlbumUserDto updateAlbumUserDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateAlbumUserWithHttpInfo(id, userId, updateAlbumUserDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Share album with users
  ///
  /// Share an album with multiple users. Each user can be given a specific role in the album.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> addUsersToAlbumWithHttpInfo(String id, AddUsersDto addUsersDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/albums/{id}/users'.replaceAll('{id}', id);

    Object? postBody = addUsersDto;

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

  /// Share album with users
  ///
  /// Share an album with multiple users. Each user can be given a specific role in the album.
  ///
  /// Available since server v1.0.0.
  Future<AlbumResponseDto> addUsersToAlbum(String id, AddUsersDto addUsersDto, {Future<void>? abortTrigger}) async {
    final response = await addUsersToAlbumWithHttpInfo(id, addUsersDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AlbumResponseDto')
          as AlbumResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
