//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AlbumApi {
  AlbumApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [AddAssetsDto] addAssetsDto (required):
  ///
  /// * [String] key:
  Future<Response> addAssetsToAlbumWithHttpInfo(String albumId, AddAssetsDto addAssetsDto, { String? key, }) async {
    // ignore: prefer_const_declarations
    final path = r'/album/{albumId}/assets'
      .replaceAll('{albumId}', albumId);

    // ignore: prefer_final_locals
    Object? postBody = addAssetsDto;

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

  /// 
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [AddAssetsDto] addAssetsDto (required):
  ///
  /// * [String] key:
  Future<AddAssetsResponseDto?> addAssetsToAlbum(String albumId, AddAssetsDto addAssetsDto, { String? key, }) async {
    final response = await addAssetsToAlbumWithHttpInfo(albumId, addAssetsDto,  key: key, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AddAssetsResponseDto',) as AddAssetsResponseDto;
    
    }
    return null;
  }

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [AddUsersDto] addUsersDto (required):
  Future<Response> addUsersToAlbumWithHttpInfo(String albumId, AddUsersDto addUsersDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/album/{albumId}/users'
      .replaceAll('{albumId}', albumId);

    // ignore: prefer_final_locals
    Object? postBody = addUsersDto;

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

  /// 
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [AddUsersDto] addUsersDto (required):
  Future<AlbumResponseDto?> addUsersToAlbum(String albumId, AddUsersDto addUsersDto,) async {
    final response = await addUsersToAlbumWithHttpInfo(albumId, addUsersDto,);
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

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [CreateAlbumDto] createAlbumDto (required):
  Future<Response> createAlbumWithHttpInfo(CreateAlbumDto createAlbumDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/album';

    // ignore: prefer_final_locals
    Object? postBody = createAlbumDto;

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

  /// 
  ///
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

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [CreateAlbumShareLinkDto] createAlbumShareLinkDto (required):
  Future<Response> createAlbumSharedLinkWithHttpInfo(CreateAlbumShareLinkDto createAlbumShareLinkDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/album/create-shared-link';

    // ignore: prefer_final_locals
    Object? postBody = createAlbumShareLinkDto;

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

  /// 
  ///
  /// Parameters:
  ///
  /// * [CreateAlbumShareLinkDto] createAlbumShareLinkDto (required):
  Future<SharedLinkResponseDto?> createAlbumSharedLink(CreateAlbumShareLinkDto createAlbumShareLinkDto,) async {
    final response = await createAlbumSharedLinkWithHttpInfo(createAlbumShareLinkDto,);
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

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  Future<Response> deleteAlbumWithHttpInfo(String albumId,) async {
    // ignore: prefer_const_declarations
    final path = r'/album/{albumId}'
      .replaceAll('{albumId}', albumId);

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

  /// 
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  Future<void> deleteAlbum(String albumId,) async {
    final response = await deleteAlbumWithHttpInfo(albumId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [String] name:
  ///
  /// * [num] skip:
  ///
  /// * [String] key:
  Future<Response> downloadArchiveWithHttpInfo(String albumId, { String? name, num? skip, String? key, }) async {
    // ignore: prefer_const_declarations
    final path = r'/album/{albumId}/download'
      .replaceAll('{albumId}', albumId);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (name != null) {
      queryParams.addAll(_queryParams('', 'name', name));
    }
    if (skip != null) {
      queryParams.addAll(_queryParams('', 'skip', skip));
    }
    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
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

  /// 
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [String] name:
  ///
  /// * [num] skip:
  ///
  /// * [String] key:
  Future<MultipartFile?> downloadArchive(String albumId, { String? name, num? skip, String? key, }) async {
    final response = await downloadArchiveWithHttpInfo(albumId,  name: name, skip: skip, key: key, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'MultipartFile',) as MultipartFile;
    
    }
    return null;
  }

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAlbumCountByUserIdWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/album/count-by-user-id';

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

  /// 
  Future<AlbumCountResponseDto?> getAlbumCountByUserId() async {
    final response = await getAlbumCountByUserIdWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AlbumCountResponseDto',) as AlbumCountResponseDto;
    
    }
    return null;
  }

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [String] key:
  Future<Response> getAlbumInfoWithHttpInfo(String albumId, { String? key, }) async {
    // ignore: prefer_const_declarations
    final path = r'/album/{albumId}'
      .replaceAll('{albumId}', albumId);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
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

  /// 
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [String] key:
  Future<AlbumResponseDto?> getAlbumInfo(String albumId, { String? key, }) async {
    final response = await getAlbumInfoWithHttpInfo(albumId,  key: key, );
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

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [bool] shared:
  ///
  /// * [String] assetId:
  ///   Only returns albums that contain the asset Ignores the shared parameter undefined: get all albums
  Future<Response> getAllAlbumsWithHttpInfo({ bool? shared, String? assetId, }) async {
    // ignore: prefer_const_declarations
    final path = r'/album';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (shared != null) {
      queryParams.addAll(_queryParams('', 'shared', shared));
    }
    if (assetId != null) {
      queryParams.addAll(_queryParams('', 'assetId', assetId));
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

  /// 
  ///
  /// Parameters:
  ///
  /// * [bool] shared:
  ///
  /// * [String] assetId:
  ///   Only returns albums that contain the asset Ignores the shared parameter undefined: get all albums
  Future<List<AlbumResponseDto>?> getAllAlbums({ bool? shared, String? assetId, }) async {
    final response = await getAllAlbumsWithHttpInfo( shared: shared, assetId: assetId, );
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
        .toList();

    }
    return null;
  }

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [RemoveAssetsDto] removeAssetsDto (required):
  Future<Response> removeAssetFromAlbumWithHttpInfo(String albumId, RemoveAssetsDto removeAssetsDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/album/{albumId}/assets'
      .replaceAll('{albumId}', albumId);

    // ignore: prefer_final_locals
    Object? postBody = removeAssetsDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

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

  /// 
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [RemoveAssetsDto] removeAssetsDto (required):
  Future<AlbumResponseDto?> removeAssetFromAlbum(String albumId, RemoveAssetsDto removeAssetsDto,) async {
    final response = await removeAssetFromAlbumWithHttpInfo(albumId, removeAssetsDto,);
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

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [String] userId (required):
  Future<Response> removeUserFromAlbumWithHttpInfo(String albumId, String userId,) async {
    // ignore: prefer_const_declarations
    final path = r'/album/{albumId}/user/{userId}'
      .replaceAll('{albumId}', albumId)
      .replaceAll('{userId}', userId);

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

  /// 
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [String] userId (required):
  Future<void> removeUserFromAlbum(String albumId, String userId,) async {
    final response = await removeUserFromAlbumWithHttpInfo(albumId, userId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// 
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [UpdateAlbumDto] updateAlbumDto (required):
  Future<Response> updateAlbumInfoWithHttpInfo(String albumId, UpdateAlbumDto updateAlbumDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/album/{albumId}'
      .replaceAll('{albumId}', albumId);

    // ignore: prefer_final_locals
    Object? postBody = updateAlbumDto;

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

  /// 
  ///
  /// Parameters:
  ///
  /// * [String] albumId (required):
  ///
  /// * [UpdateAlbumDto] updateAlbumDto (required):
  Future<AlbumResponseDto?> updateAlbumInfo(String albumId, UpdateAlbumDto updateAlbumDto,) async {
    final response = await updateAlbumInfoWithHttpInfo(albumId, updateAlbumDto,);
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
}
