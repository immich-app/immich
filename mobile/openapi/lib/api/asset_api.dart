//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetApi {
  AssetApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'PATCH /asset/shared-link/add' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [AddAssetsDto] addAssetsDto (required):
  ///
  /// * [String] key:
  Future<Response> addAssetsToSharedLinkWithHttpInfo(AddAssetsDto addAssetsDto, { String? key, }) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/shared-link/add';

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
  /// * [AddAssetsDto] addAssetsDto (required):
  ///
  /// * [String] key:
  Future<SharedLinkResponseDto?> addAssetsToSharedLink(AddAssetsDto addAssetsDto, { String? key, }) async {
    final response = await addAssetsToSharedLinkWithHttpInfo(addAssetsDto,  key: key, );
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

  /// Checks if assets exist by checksums
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [AssetBulkUploadCheckDto] assetBulkUploadCheckDto (required):
  Future<Response> bulkUploadCheckWithHttpInfo(AssetBulkUploadCheckDto assetBulkUploadCheckDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/bulk-upload-check';

    // ignore: prefer_final_locals
    Object? postBody = assetBulkUploadCheckDto;

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

  /// Checks if assets exist by checksums
  ///
  /// Parameters:
  ///
  /// * [AssetBulkUploadCheckDto] assetBulkUploadCheckDto (required):
  Future<AssetBulkUploadCheckResponseDto?> bulkUploadCheck(AssetBulkUploadCheckDto assetBulkUploadCheckDto,) async {
    final response = await bulkUploadCheckWithHttpInfo(assetBulkUploadCheckDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetBulkUploadCheckResponseDto',) as AssetBulkUploadCheckResponseDto;
    
    }
    return null;
  }

  /// Check duplicated asset before uploading - for Web upload used
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [CheckDuplicateAssetDto] checkDuplicateAssetDto (required):
  ///
  /// * [String] key:
  Future<Response> checkDuplicateAssetWithHttpInfo(CheckDuplicateAssetDto checkDuplicateAssetDto, { String? key, }) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/check';

    // ignore: prefer_final_locals
    Object? postBody = checkDuplicateAssetDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }

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

  /// Check duplicated asset before uploading - for Web upload used
  ///
  /// Parameters:
  ///
  /// * [CheckDuplicateAssetDto] checkDuplicateAssetDto (required):
  ///
  /// * [String] key:
  Future<CheckDuplicateAssetResponseDto?> checkDuplicateAsset(CheckDuplicateAssetDto checkDuplicateAssetDto, { String? key, }) async {
    final response = await checkDuplicateAssetWithHttpInfo(checkDuplicateAssetDto,  key: key, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'CheckDuplicateAssetResponseDto',) as CheckDuplicateAssetResponseDto;
    
    }
    return null;
  }

  /// Checks if multiple assets exist on the server and returns all existing - used by background backup
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [CheckExistingAssetsDto] checkExistingAssetsDto (required):
  Future<Response> checkExistingAssetsWithHttpInfo(CheckExistingAssetsDto checkExistingAssetsDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/exist';

    // ignore: prefer_final_locals
    Object? postBody = checkExistingAssetsDto;

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

  /// Checks if multiple assets exist on the server and returns all existing - used by background backup
  ///
  /// Parameters:
  ///
  /// * [CheckExistingAssetsDto] checkExistingAssetsDto (required):
  Future<CheckExistingAssetsResponseDto?> checkExistingAssets(CheckExistingAssetsDto checkExistingAssetsDto,) async {
    final response = await checkExistingAssetsWithHttpInfo(checkExistingAssetsDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'CheckExistingAssetsResponseDto',) as CheckExistingAssetsResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /asset/shared-link' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [CreateAssetsShareLinkDto] createAssetsShareLinkDto (required):
  Future<Response> createAssetsSharedLinkWithHttpInfo(CreateAssetsShareLinkDto createAssetsShareLinkDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/shared-link';

    // ignore: prefer_final_locals
    Object? postBody = createAssetsShareLinkDto;

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
  /// * [CreateAssetsShareLinkDto] createAssetsShareLinkDto (required):
  Future<SharedLinkResponseDto?> createAssetsSharedLink(CreateAssetsShareLinkDto createAssetsShareLinkDto,) async {
    final response = await createAssetsSharedLinkWithHttpInfo(createAssetsShareLinkDto,);
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

  /// Performs an HTTP 'DELETE /asset' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [DeleteAssetDto] deleteAssetDto (required):
  Future<Response> deleteAssetWithHttpInfo(DeleteAssetDto deleteAssetDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset';

    // ignore: prefer_final_locals
    Object? postBody = deleteAssetDto;

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

  /// Parameters:
  ///
  /// * [DeleteAssetDto] deleteAssetDto (required):
  Future<List<DeleteAssetResponseDto>?> deleteAsset(DeleteAssetDto deleteAssetDto,) async {
    final response = await deleteAssetWithHttpInfo(deleteAssetDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<DeleteAssetResponseDto>') as List)
        .cast<DeleteAssetResponseDto>()
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/download/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  Future<Response> downloadFileWithHttpInfo(String id, { String? key, }) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/download/{id}'
      .replaceAll('{id}', id);

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

  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  Future<MultipartFile?> downloadFile(String id, { String? key, }) async {
    final response = await downloadFileWithHttpInfo(id,  key: key, );
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

  /// Performs an HTTP 'POST /asset/download-files' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [DownloadFilesDto] downloadFilesDto (required):
  ///
  /// * [String] key:
  Future<Response> downloadFilesWithHttpInfo(DownloadFilesDto downloadFilesDto, { String? key, }) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/download-files';

    // ignore: prefer_final_locals
    Object? postBody = downloadFilesDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }

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
  /// * [DownloadFilesDto] downloadFilesDto (required):
  ///
  /// * [String] key:
  Future<MultipartFile?> downloadFiles(DownloadFilesDto downloadFilesDto, { String? key, }) async {
    final response = await downloadFilesWithHttpInfo(downloadFilesDto,  key: key, );
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

  /// Current this is not used in any UI element
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] name:
  ///
  /// * [num] skip:
  ///
  /// * [String] key:
  Future<Response> downloadLibraryWithHttpInfo({ String? name, num? skip, String? key, }) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/download-library';

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

  /// Current this is not used in any UI element
  ///
  /// Parameters:
  ///
  /// * [String] name:
  ///
  /// * [num] skip:
  ///
  /// * [String] key:
  Future<MultipartFile?> downloadLibrary({ String? name, num? skip, String? key, }) async {
    final response = await downloadLibraryWithHttpInfo( name: name, skip: skip, key: key, );
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

  /// Get all AssetEntity belong to the user
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] userId:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isArchived:
  ///
  /// * [bool] withoutThumbs:
  ///   Include assets without thumbnails
  ///
  /// * [num] skip:
  ///
  /// * [String] ifNoneMatch:
  ///   ETag of data already cached on the client
  Future<Response> getAllAssetsWithHttpInfo({ String? userId, bool? isFavorite, bool? isArchived, bool? withoutThumbs, num? skip, String? ifNoneMatch, }) async {
    // ignore: prefer_const_declarations
    final path = r'/asset';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (userId != null) {
      queryParams.addAll(_queryParams('', 'userId', userId));
    }
    if (isFavorite != null) {
      queryParams.addAll(_queryParams('', 'isFavorite', isFavorite));
    }
    if (isArchived != null) {
      queryParams.addAll(_queryParams('', 'isArchived', isArchived));
    }
    if (withoutThumbs != null) {
      queryParams.addAll(_queryParams('', 'withoutThumbs', withoutThumbs));
    }
    if (skip != null) {
      queryParams.addAll(_queryParams('', 'skip', skip));
    }

    if (ifNoneMatch != null) {
      headerParams[r'if-none-match'] = parameterToString(ifNoneMatch);
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

  /// Get all AssetEntity belong to the user
  ///
  /// Parameters:
  ///
  /// * [String] userId:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isArchived:
  ///
  /// * [bool] withoutThumbs:
  ///   Include assets without thumbnails
  ///
  /// * [num] skip:
  ///
  /// * [String] ifNoneMatch:
  ///   ETag of data already cached on the client
  Future<List<AssetResponseDto>?> getAllAssets({ String? userId, bool? isFavorite, bool? isArchived, bool? withoutThumbs, num? skip, String? ifNoneMatch, }) async {
    final response = await getAllAssetsWithHttpInfo( userId: userId, isFavorite: isFavorite, isArchived: isArchived, withoutThumbs: withoutThumbs, skip: skip, ifNoneMatch: ifNoneMatch, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AssetResponseDto>') as List)
        .cast<AssetResponseDto>()
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/stat/archive' operation and returns the [Response].
  Future<Response> getArchivedAssetCountByUserIdWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/asset/stat/archive';

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

  Future<AssetCountByUserIdResponseDto?> getArchivedAssetCountByUserId() async {
    final response = await getArchivedAssetCountByUserIdWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetCountByUserIdResponseDto',) as AssetCountByUserIdResponseDto;
    
    }
    return null;
  }

  /// Get a single asset's information
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  Future<Response> getAssetByIdWithHttpInfo(String id, { String? key, }) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/assetById/{id}'
      .replaceAll('{id}', id);

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

  /// Get a single asset's information
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  Future<AssetResponseDto?> getAssetById(String id, { String? key, }) async {
    final response = await getAssetByIdWithHttpInfo(id,  key: key, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetResponseDto',) as AssetResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /asset/time-bucket' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [GetAssetByTimeBucketDto] getAssetByTimeBucketDto (required):
  Future<Response> getAssetByTimeBucketWithHttpInfo(GetAssetByTimeBucketDto getAssetByTimeBucketDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/time-bucket';

    // ignore: prefer_final_locals
    Object? postBody = getAssetByTimeBucketDto;

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
  /// * [GetAssetByTimeBucketDto] getAssetByTimeBucketDto (required):
  Future<List<AssetResponseDto>?> getAssetByTimeBucket(GetAssetByTimeBucketDto getAssetByTimeBucketDto,) async {
    final response = await getAssetByTimeBucketWithHttpInfo(getAssetByTimeBucketDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AssetResponseDto>') as List)
        .cast<AssetResponseDto>()
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'POST /asset/count-by-time-bucket' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [GetAssetCountByTimeBucketDto] getAssetCountByTimeBucketDto (required):
  Future<Response> getAssetCountByTimeBucketWithHttpInfo(GetAssetCountByTimeBucketDto getAssetCountByTimeBucketDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/count-by-time-bucket';

    // ignore: prefer_final_locals
    Object? postBody = getAssetCountByTimeBucketDto;

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
  /// * [GetAssetCountByTimeBucketDto] getAssetCountByTimeBucketDto (required):
  Future<AssetCountByTimeBucketResponseDto?> getAssetCountByTimeBucket(GetAssetCountByTimeBucketDto getAssetCountByTimeBucketDto,) async {
    final response = await getAssetCountByTimeBucketWithHttpInfo(getAssetCountByTimeBucketDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetCountByTimeBucketResponseDto',) as AssetCountByTimeBucketResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/count-by-user-id' operation and returns the [Response].
  Future<Response> getAssetCountByUserIdWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/asset/count-by-user-id';

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

  Future<AssetCountByUserIdResponseDto?> getAssetCountByUserId() async {
    final response = await getAssetCountByUserIdWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetCountByUserIdResponseDto',) as AssetCountByUserIdResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/search-terms' operation and returns the [Response].
  Future<Response> getAssetSearchTermsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/asset/search-terms';

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

  Future<List<String>?> getAssetSearchTerms() async {
    final response = await getAssetSearchTermsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<String>') as List)
        .cast<String>()
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/thumbnail/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [ThumbnailFormat] format:
  ///
  /// * [String] key:
  Future<Response> getAssetThumbnailWithHttpInfo(String id, { ThumbnailFormat? format, String? key, }) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/thumbnail/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (format != null) {
      queryParams.addAll(_queryParams('', 'format', format));
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

  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [ThumbnailFormat] format:
  ///
  /// * [String] key:
  Future<MultipartFile?> getAssetThumbnail(String id, { ThumbnailFormat? format, String? key, }) async {
    final response = await getAssetThumbnailWithHttpInfo(id,  format: format, key: key, );
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

  /// Performs an HTTP 'GET /asset/curated-locations' operation and returns the [Response].
  Future<Response> getCuratedLocationsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/asset/curated-locations';

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

  Future<List<CuratedLocationsResponseDto>?> getCuratedLocations() async {
    final response = await getCuratedLocationsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<CuratedLocationsResponseDto>') as List)
        .cast<CuratedLocationsResponseDto>()
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/curated-objects' operation and returns the [Response].
  Future<Response> getCuratedObjectsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/asset/curated-objects';

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

  Future<List<CuratedObjectsResponseDto>?> getCuratedObjects() async {
    final response = await getCuratedObjectsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<CuratedObjectsResponseDto>') as List)
        .cast<CuratedObjectsResponseDto>()
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/map-marker' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [DateTime] fileCreatedAfter:
  ///
  /// * [DateTime] fileCreatedBefore:
  Future<Response> getMapMarkersWithHttpInfo({ bool? isFavorite, DateTime? fileCreatedAfter, DateTime? fileCreatedBefore, }) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/map-marker';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (isFavorite != null) {
      queryParams.addAll(_queryParams('', 'isFavorite', isFavorite));
    }
    if (fileCreatedAfter != null) {
      queryParams.addAll(_queryParams('', 'fileCreatedAfter', fileCreatedAfter));
    }
    if (fileCreatedBefore != null) {
      queryParams.addAll(_queryParams('', 'fileCreatedBefore', fileCreatedBefore));
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
  /// * [bool] isFavorite:
  ///
  /// * [DateTime] fileCreatedAfter:
  ///
  /// * [DateTime] fileCreatedBefore:
  Future<List<MapMarkerResponseDto>?> getMapMarkers({ bool? isFavorite, DateTime? fileCreatedAfter, DateTime? fileCreatedBefore, }) async {
    final response = await getMapMarkersWithHttpInfo( isFavorite: isFavorite, fileCreatedAfter: fileCreatedAfter, fileCreatedBefore: fileCreatedBefore, );
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
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/memory-lane' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [DateTime] timestamp (required):
  ///   Get pictures for +24 hours from this time going back x years
  Future<Response> getMemoryLaneWithHttpInfo(DateTime timestamp,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/memory-lane';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'timestamp', timestamp));

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
  /// * [DateTime] timestamp (required):
  ///   Get pictures for +24 hours from this time going back x years
  Future<List<MemoryLaneResponseDto>?> getMemoryLane(DateTime timestamp,) async {
    final response = await getMemoryLaneWithHttpInfo(timestamp,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<MemoryLaneResponseDto>') as List)
        .cast<MemoryLaneResponseDto>()
        .toList();

    }
    return null;
  }

  /// Get all asset of a device that are in the database, ID only.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] deviceId (required):
  Future<Response> getUserAssetsByDeviceIdWithHttpInfo(String deviceId,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/{deviceId}'
      .replaceAll('{deviceId}', deviceId);

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

  /// Get all asset of a device that are in the database, ID only.
  ///
  /// Parameters:
  ///
  /// * [String] deviceId (required):
  Future<List<String>?> getUserAssetsByDeviceId(String deviceId,) async {
    final response = await getUserAssetsByDeviceIdWithHttpInfo(deviceId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<String>') as List)
        .cast<String>()
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'PATCH /asset/shared-link/remove' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [RemoveAssetsDto] removeAssetsDto (required):
  ///
  /// * [String] key:
  Future<Response> removeAssetsFromSharedLinkWithHttpInfo(RemoveAssetsDto removeAssetsDto, { String? key, }) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/shared-link/remove';

    // ignore: prefer_final_locals
    Object? postBody = removeAssetsDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }

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
  /// * [RemoveAssetsDto] removeAssetsDto (required):
  ///
  /// * [String] key:
  Future<SharedLinkResponseDto?> removeAssetsFromSharedLink(RemoveAssetsDto removeAssetsDto, { String? key, }) async {
    final response = await removeAssetsFromSharedLinkWithHttpInfo(removeAssetsDto,  key: key, );
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

  /// Performs an HTTP 'POST /asset/search' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [SearchAssetDto] searchAssetDto (required):
  Future<Response> searchAssetWithHttpInfo(SearchAssetDto searchAssetDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/search';

    // ignore: prefer_final_locals
    Object? postBody = searchAssetDto;

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
  /// * [SearchAssetDto] searchAssetDto (required):
  Future<List<AssetResponseDto>?> searchAsset(SearchAssetDto searchAssetDto,) async {
    final response = await searchAssetWithHttpInfo(searchAssetDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AssetResponseDto>') as List)
        .cast<AssetResponseDto>()
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'GET /asset/file/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [bool] isThumb:
  ///
  /// * [bool] isWeb:
  ///
  /// * [String] key:
  Future<Response> serveFileWithHttpInfo(String id, { bool? isThumb, bool? isWeb, String? key, }) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/file/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (isThumb != null) {
      queryParams.addAll(_queryParams('', 'isThumb', isThumb));
    }
    if (isWeb != null) {
      queryParams.addAll(_queryParams('', 'isWeb', isWeb));
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

  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [bool] isThumb:
  ///
  /// * [bool] isWeb:
  ///
  /// * [String] key:
  Future<MultipartFile?> serveFile(String id, { bool? isThumb, bool? isWeb, String? key, }) async {
    final response = await serveFileWithHttpInfo(id,  isThumb: isThumb, isWeb: isWeb, key: key, );
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

  /// Update an asset
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateAssetDto] updateAssetDto (required):
  Future<Response> updateAssetWithHttpInfo(String id, UpdateAssetDto updateAssetDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = updateAssetDto;

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

  /// Update an asset
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateAssetDto] updateAssetDto (required):
  Future<AssetResponseDto?> updateAsset(String id, UpdateAssetDto updateAssetDto,) async {
    final response = await updateAssetWithHttpInfo(id, updateAssetDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetResponseDto',) as AssetResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /asset/upload' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [AssetTypeEnum] assetType (required):
  ///
  /// * [MultipartFile] assetData (required):
  ///
  /// * [String] deviceAssetId (required):
  ///
  /// * [String] deviceId (required):
  ///
  /// * [DateTime] fileCreatedAt (required):
  ///
  /// * [DateTime] fileModifiedAt (required):
  ///
  /// * [bool] isFavorite (required):
  ///
  /// * [String] fileExtension (required):
  ///
  /// * [String] key:
  ///
  /// * [MultipartFile] livePhotoData:
  ///
  /// * [MultipartFile] sidecarData:
  ///
  /// * [bool] isArchived:
  ///
  /// * [bool] isVisible:
  ///
  /// * [String] duration:
  Future<Response> uploadFileWithHttpInfo(AssetTypeEnum assetType, MultipartFile assetData, String deviceAssetId, String deviceId, DateTime fileCreatedAt, DateTime fileModifiedAt, bool isFavorite, String fileExtension, { String? key, MultipartFile? livePhotoData, MultipartFile? sidecarData, bool? isArchived, bool? isVisible, String? duration, }) async {
    // ignore: prefer_const_declarations
    final path = r'/asset/upload';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }

    const contentTypes = <String>['multipart/form-data'];

    bool hasFields = false;
    final mp = MultipartRequest('POST', Uri.parse(path));
    if (assetType != null) {
      hasFields = true;
      mp.fields[r'assetType'] = parameterToString(assetType);
    }
    if (assetData != null) {
      hasFields = true;
      mp.fields[r'assetData'] = assetData.field;
      mp.files.add(assetData);
    }
    if (livePhotoData != null) {
      hasFields = true;
      mp.fields[r'livePhotoData'] = livePhotoData.field;
      mp.files.add(livePhotoData);
    }
    if (sidecarData != null) {
      hasFields = true;
      mp.fields[r'sidecarData'] = sidecarData.field;
      mp.files.add(sidecarData);
    }
    if (deviceAssetId != null) {
      hasFields = true;
      mp.fields[r'deviceAssetId'] = parameterToString(deviceAssetId);
    }
    if (deviceId != null) {
      hasFields = true;
      mp.fields[r'deviceId'] = parameterToString(deviceId);
    }
    if (fileCreatedAt != null) {
      hasFields = true;
      mp.fields[r'fileCreatedAt'] = parameterToString(fileCreatedAt);
    }
    if (fileModifiedAt != null) {
      hasFields = true;
      mp.fields[r'fileModifiedAt'] = parameterToString(fileModifiedAt);
    }
    if (isFavorite != null) {
      hasFields = true;
      mp.fields[r'isFavorite'] = parameterToString(isFavorite);
    }
    if (isArchived != null) {
      hasFields = true;
      mp.fields[r'isArchived'] = parameterToString(isArchived);
    }
    if (isVisible != null) {
      hasFields = true;
      mp.fields[r'isVisible'] = parameterToString(isVisible);
    }
    if (fileExtension != null) {
      hasFields = true;
      mp.fields[r'fileExtension'] = parameterToString(fileExtension);
    }
    if (duration != null) {
      hasFields = true;
      mp.fields[r'duration'] = parameterToString(duration);
    }
    if (hasFields) {
      postBody = mp;
    }

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
  /// * [AssetTypeEnum] assetType (required):
  ///
  /// * [MultipartFile] assetData (required):
  ///
  /// * [String] deviceAssetId (required):
  ///
  /// * [String] deviceId (required):
  ///
  /// * [DateTime] fileCreatedAt (required):
  ///
  /// * [DateTime] fileModifiedAt (required):
  ///
  /// * [bool] isFavorite (required):
  ///
  /// * [String] fileExtension (required):
  ///
  /// * [String] key:
  ///
  /// * [MultipartFile] livePhotoData:
  ///
  /// * [MultipartFile] sidecarData:
  ///
  /// * [bool] isArchived:
  ///
  /// * [bool] isVisible:
  ///
  /// * [String] duration:
  Future<AssetFileUploadResponseDto?> uploadFile(AssetTypeEnum assetType, MultipartFile assetData, String deviceAssetId, String deviceId, DateTime fileCreatedAt, DateTime fileModifiedAt, bool isFavorite, String fileExtension, { String? key, MultipartFile? livePhotoData, MultipartFile? sidecarData, bool? isArchived, bool? isVisible, String? duration, }) async {
    final response = await uploadFileWithHttpInfo(assetType, assetData, deviceAssetId, deviceId, fileCreatedAt, fileModifiedAt, isFavorite, fileExtension,  key: key, livePhotoData: livePhotoData, sidecarData: sidecarData, isArchived: isArchived, isVisible: isVisible, duration: duration, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetFileUploadResponseDto',) as AssetFileUploadResponseDto;
    
    }
    return null;
  }
}
