// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class AssetsApi {
  AssetsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion deleteAssetsAddedIn = .new(1, 0, 0);

  static const ApiState deleteAssetsState = .stable;

  static const ApiVersion uploadAssetAddedIn = .new(1, 0, 0);

  static const ApiState uploadAssetState = .stable;

  static const ApiVersion updateAssetsAddedIn = .new(1, 0, 0);

  static const ApiState updateAssetsState = .stable;

  static const ApiVersion checkBulkUploadAddedIn = .new(1, 0, 0);

  static const ApiState checkBulkUploadState = .stable;

  static const ApiVersion copyAssetAddedIn = .new(1, 0, 0);

  static const ApiState copyAssetState = .stable;

  static const ApiVersion runAssetJobsAddedIn = .new(1, 0, 0);

  static const ApiState runAssetJobsState = .stable;

  static const ApiVersion deleteBulkAssetMetadataAddedIn = .new(1, 0, 0);

  static const ApiState deleteBulkAssetMetadataState = .beta;

  static const ApiVersion updateBulkAssetMetadataAddedIn = .new(1, 0, 0);

  static const ApiState updateBulkAssetMetadataState = .beta;

  static const ApiVersion getAssetStatisticsAddedIn = .new(1, 0, 0);

  static const ApiState getAssetStatisticsState = .stable;

  static const ApiVersion getAssetInfoAddedIn = .new(1, 0, 0);

  static const ApiState getAssetInfoState = .stable;

  static const ApiVersion updateAssetAddedIn = .new(1, 0, 0);

  static const ApiState updateAssetState = .stable;

  static const ApiVersion removeAssetEditsAddedIn = .new(2, 5, 0);

  static const ApiState removeAssetEditsState = .beta;

  static const ApiVersion getAssetEditsAddedIn = .new(2, 5, 0);

  static const ApiState getAssetEditsState = .beta;

  static const ApiVersion editAssetAddedIn = .new(2, 5, 0);

  static const ApiState editAssetState = .beta;

  static const ApiVersion getAssetMetadataAddedIn = .new(1, 0, 0);

  static const ApiState getAssetMetadataState = .stable;

  static const ApiVersion updateAssetMetadataAddedIn = .new(1, 0, 0);

  static const ApiState updateAssetMetadataState = .stable;

  static const ApiVersion deleteAssetMetadataAddedIn = .new(1, 0, 0);

  static const ApiState deleteAssetMetadataState = .stable;

  static const ApiVersion getAssetMetadataByKeyAddedIn = .new(1, 0, 0);

  static const ApiState getAssetMetadataByKeyState = .stable;

  static const ApiVersion getAssetOcrAddedIn = .new(1, 0, 0);

  static const ApiState getAssetOcrState = .stable;

  static const ApiVersion downloadAssetAddedIn = .new(1, 0, 0);

  static const ApiState downloadAssetState = .stable;

  static const ApiVersion viewAssetAddedIn = .new(1, 0, 0);

  static const ApiState viewAssetState = .stable;

  static const ApiVersion playAssetVideoAddedIn = .new(1, 0, 0);

  static const ApiState playAssetVideoState = .stable;

  /// Delete assets
  ///
  /// Deletes multiple assets at the same time.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteAssetsWithHttpInfo(AssetBulkDeleteDto assetBulkDeleteDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/assets';

    Object? postBody = assetBulkDeleteDto;

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

  /// Delete assets
  ///
  /// Deletes multiple assets at the same time.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteAssets(AssetBulkDeleteDto assetBulkDeleteDto, {Future<void>? abortTrigger}) async {
    final response = await deleteAssetsWithHttpInfo(assetBulkDeleteDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Upload asset
  ///
  /// Uploads a new asset to the server.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> uploadAssetWithHttpInfo(
    MultipartFile assetData,
    DateTime fileCreatedAt,
    DateTime fileModifiedAt, {
    int? duration,
    String? filename,
    bool? isFavorite,
    String? livePhotoVideoId,
    List<AssetMetadataUpsertItemDto>? metadata,
    MultipartFile? sidecarData,
    AssetVisibility? visibility,
    String? key,
    String? slug,
    String? xImmichChecksum,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/assets';

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

    if (xImmichChecksum != null) {
      headerParams[r'x-immich-checksum'] = parameterToString(xImmichChecksum);
    }

    const contentTypes = <String>[r'multipart/form-data'];

    bool hasFields = false;
    final mp = MultipartRequest('POST', Uri.parse(apiPath));
    hasFields = true;
    mp.fields[r'assetData'] = assetData.field;
    mp.files.add(assetData);
    if (duration != null) {
      hasFields = true;
      mp.fields[r'duration'] = parameterToString(duration);
    }
    hasFields = true;
    mp.fields[r'fileCreatedAt'] = parameterToString(fileCreatedAt);
    hasFields = true;
    mp.fields[r'fileModifiedAt'] = parameterToString(fileModifiedAt);
    if (filename != null) {
      hasFields = true;
      mp.fields[r'filename'] = parameterToString(filename);
    }
    if (isFavorite != null) {
      hasFields = true;
      mp.fields[r'isFavorite'] = parameterToString(isFavorite);
    }
    if (livePhotoVideoId != null) {
      hasFields = true;
      mp.fields[r'livePhotoVideoId'] = parameterToString(livePhotoVideoId);
    }
    if (metadata != null) {
      hasFields = true;
      mp.fields[r'metadata'] = parameterToString(metadata);
    }
    if (sidecarData != null) {
      hasFields = true;
      mp.fields[r'sidecarData'] = sidecarData.field;
      mp.files.add(sidecarData);
    }
    if (visibility != null) {
      hasFields = true;
      mp.fields[r'visibility'] = parameterToString(visibility);
    }
    if (hasFields) {
      postBody = mp;
    }

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

  /// Upload asset
  ///
  /// Uploads a new asset to the server.
  ///
  /// Available since server v1.0.0.
  Future<AssetMediaResponseDto> uploadAsset(
    MultipartFile assetData,
    DateTime fileCreatedAt,
    DateTime fileModifiedAt, {
    int? duration,
    String? filename,
    bool? isFavorite,
    String? livePhotoVideoId,
    List<AssetMetadataUpsertItemDto>? metadata,
    MultipartFile? sidecarData,
    AssetVisibility? visibility,
    String? key,
    String? slug,
    String? xImmichChecksum,
    Future<void>? abortTrigger,
  }) async {
    final response = await uploadAssetWithHttpInfo(
      assetData,
      fileCreatedAt,
      fileModifiedAt,
      key: key,
      slug: slug,
      xImmichChecksum: xImmichChecksum,
      duration: duration,
      filename: filename,
      isFavorite: isFavorite,
      livePhotoVideoId: livePhotoVideoId,
      metadata: metadata,
      sidecarData: sidecarData,
      visibility: visibility,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AssetMediaResponseDto')
          as AssetMediaResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update assets
  ///
  /// Updates multiple assets at the same time.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateAssetsWithHttpInfo(AssetBulkUpdateDto assetBulkUpdateDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/assets';

    Object? postBody = assetBulkUpdateDto;

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

  /// Update assets
  ///
  /// Updates multiple assets at the same time.
  ///
  /// Available since server v1.0.0.
  Future<void> updateAssets(AssetBulkUpdateDto assetBulkUpdateDto, {Future<void>? abortTrigger}) async {
    final response = await updateAssetsWithHttpInfo(assetBulkUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Check bulk upload
  ///
  /// Determine which assets have already been uploaded to the server based on their SHA1 checksums.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> checkBulkUploadWithHttpInfo(
    AssetBulkUploadCheckDto assetBulkUploadCheckDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/assets/bulk-upload-check';

    Object? postBody = assetBulkUploadCheckDto;

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

  /// Check bulk upload
  ///
  /// Determine which assets have already been uploaded to the server based on their SHA1 checksums.
  ///
  /// Available since server v1.0.0.
  Future<AssetBulkUploadCheckResponseDto> checkBulkUpload(
    AssetBulkUploadCheckDto assetBulkUploadCheckDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await checkBulkUploadWithHttpInfo(assetBulkUploadCheckDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AssetBulkUploadCheckResponseDto')
          as AssetBulkUploadCheckResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Copy asset
  ///
  /// Copy asset information like albums, tags, etc. from one asset to another.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> copyAssetWithHttpInfo(AssetCopyDto assetCopyDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/assets/copy';

    Object? postBody = assetCopyDto;

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

  /// Copy asset
  ///
  /// Copy asset information like albums, tags, etc. from one asset to another.
  ///
  /// Available since server v1.0.0.
  Future<void> copyAsset(AssetCopyDto assetCopyDto, {Future<void>? abortTrigger}) async {
    final response = await copyAssetWithHttpInfo(assetCopyDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Run an asset job
  ///
  /// Run a specific job on a set of assets.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> runAssetJobsWithHttpInfo(AssetJobsDto assetJobsDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/assets/jobs';

    Object? postBody = assetJobsDto;

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

  /// Run an asset job
  ///
  /// Run a specific job on a set of assets.
  ///
  /// Available since server v1.0.0.
  Future<void> runAssetJobs(AssetJobsDto assetJobsDto, {Future<void>? abortTrigger}) async {
    final response = await runAssetJobsWithHttpInfo(assetJobsDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Delete asset metadata
  ///
  /// Delete metadata key-value pairs for multiple assets.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteBulkAssetMetadataWithHttpInfo(
    AssetMetadataBulkDeleteDto assetMetadataBulkDeleteDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/assets/metadata';

    Object? postBody = assetMetadataBulkDeleteDto;

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

  /// Delete asset metadata
  ///
  /// Delete metadata key-value pairs for multiple assets.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteBulkAssetMetadata(
    AssetMetadataBulkDeleteDto assetMetadataBulkDeleteDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await deleteBulkAssetMetadataWithHttpInfo(assetMetadataBulkDeleteDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Upsert asset metadata
  ///
  /// Upsert metadata key-value pairs for multiple assets.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateBulkAssetMetadataWithHttpInfo(
    AssetMetadataBulkUpsertDto assetMetadataBulkUpsertDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/assets/metadata';

    Object? postBody = assetMetadataBulkUpsertDto;

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

  /// Upsert asset metadata
  ///
  /// Upsert metadata key-value pairs for multiple assets.
  ///
  /// Available since server v1.0.0.
  Future<List<AssetMetadataBulkResponseDto>> updateBulkAssetMetadata(
    AssetMetadataBulkUpsertDto assetMetadataBulkUpsertDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateBulkAssetMetadataWithHttpInfo(assetMetadataBulkUpsertDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<AssetMetadataBulkResponseDto>') as List)
          .cast<AssetMetadataBulkResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get asset statistics
  ///
  /// Retrieve various statistics about the assets owned by the authenticated user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAssetStatisticsWithHttpInfo({
    bool? isFavorite,
    bool? isTrashed,
    AssetVisibility? visibility,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/assets/statistics';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (isFavorite != null) {
      queryParams.addAll(_queryParams('', 'isFavorite', isFavorite));
    }
    if (isTrashed != null) {
      queryParams.addAll(_queryParams('', 'isTrashed', isTrashed));
    }
    if (visibility != null) {
      queryParams.addAll(_queryParams('', 'visibility', visibility));
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

  /// Get asset statistics
  ///
  /// Retrieve various statistics about the assets owned by the authenticated user.
  ///
  /// Available since server v1.0.0.
  Future<AssetStatsResponseDto> getAssetStatistics({
    bool? isFavorite,
    bool? isTrashed,
    AssetVisibility? visibility,
    Future<void>? abortTrigger,
  }) async {
    final response = await getAssetStatisticsWithHttpInfo(
      isFavorite: isFavorite,
      isTrashed: isTrashed,
      visibility: visibility,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AssetStatsResponseDto')
          as AssetStatsResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve an asset
  ///
  /// Retrieve detailed information about a specific asset.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAssetInfoWithHttpInfo(String id, {String? key, String? slug, Future<void>? abortTrigger}) async {
    final apiPath = r'/assets/{id}'.replaceAll('{id}', id);

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

  /// Retrieve an asset
  ///
  /// Retrieve detailed information about a specific asset.
  ///
  /// Available since server v1.0.0.
  Future<AssetResponseDto> getAssetInfo(String id, {String? key, String? slug, Future<void>? abortTrigger}) async {
    final response = await getAssetInfoWithHttpInfo(id, key: key, slug: slug, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AssetResponseDto')
          as AssetResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update an asset
  ///
  /// Update information of a specific asset.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateAssetWithHttpInfo(
    String id,
    UpdateAssetDto updateAssetDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/assets/{id}'.replaceAll('{id}', id);

    Object? postBody = updateAssetDto;

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

  /// Update an asset
  ///
  /// Update information of a specific asset.
  ///
  /// Available since server v1.0.0.
  Future<AssetResponseDto> updateAsset(String id, UpdateAssetDto updateAssetDto, {Future<void>? abortTrigger}) async {
    final response = await updateAssetWithHttpInfo(id, updateAssetDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AssetResponseDto')
          as AssetResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Remove edits from an existing asset
  ///
  /// Removes all edit actions (crop, rotate, mirror) associated with the specified asset.
  ///
  /// Available since server v2.5.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> removeAssetEditsWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/assets/{id}/edits'.replaceAll('{id}', id);

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

  /// Remove edits from an existing asset
  ///
  /// Removes all edit actions (crop, rotate, mirror) associated with the specified asset.
  ///
  /// Available since server v2.5.0.
  Future<void> removeAssetEdits(String id, {Future<void>? abortTrigger}) async {
    final response = await removeAssetEditsWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve edits for an existing asset
  ///
  /// Retrieve a series of edit actions (crop, rotate, mirror) associated with the specified asset.
  ///
  /// Available since server v2.5.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAssetEditsWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/assets/{id}/edits'.replaceAll('{id}', id);

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

  /// Retrieve edits for an existing asset
  ///
  /// Retrieve a series of edit actions (crop, rotate, mirror) associated with the specified asset.
  ///
  /// Available since server v2.5.0.
  Future<AssetEditsResponseDto> getAssetEdits(String id, {Future<void>? abortTrigger}) async {
    final response = await getAssetEditsWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AssetEditsResponseDto')
          as AssetEditsResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Apply edits to an existing asset
  ///
  /// Apply a series of edit actions (crop, rotate, mirror) to the specified asset.
  ///
  /// Available since server v2.5.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> editAssetWithHttpInfo(
    String id,
    AssetEditsCreateDto assetEditsCreateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/assets/{id}/edits'.replaceAll('{id}', id);

    Object? postBody = assetEditsCreateDto;

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

  /// Apply edits to an existing asset
  ///
  /// Apply a series of edit actions (crop, rotate, mirror) to the specified asset.
  ///
  /// Available since server v2.5.0.
  Future<AssetEditsResponseDto> editAsset(
    String id,
    AssetEditsCreateDto assetEditsCreateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await editAssetWithHttpInfo(id, assetEditsCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AssetEditsResponseDto')
          as AssetEditsResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get asset metadata
  ///
  /// Retrieve all metadata key-value pairs associated with the specified asset.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAssetMetadataWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/assets/{id}/metadata'.replaceAll('{id}', id);

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

  /// Get asset metadata
  ///
  /// Retrieve all metadata key-value pairs associated with the specified asset.
  ///
  /// Available since server v1.0.0.
  Future<List<AssetMetadataResponseDto>> getAssetMetadata(String id, {Future<void>? abortTrigger}) async {
    final response = await getAssetMetadataWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<AssetMetadataResponseDto>') as List)
          .cast<AssetMetadataResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update asset metadata
  ///
  /// Update or add metadata key-value pairs for the specified asset.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateAssetMetadataWithHttpInfo(
    String id,
    AssetMetadataUpsertDto assetMetadataUpsertDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/assets/{id}/metadata'.replaceAll('{id}', id);

    Object? postBody = assetMetadataUpsertDto;

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

  /// Update asset metadata
  ///
  /// Update or add metadata key-value pairs for the specified asset.
  ///
  /// Available since server v1.0.0.
  Future<List<AssetMetadataResponseDto>> updateAssetMetadata(
    String id,
    AssetMetadataUpsertDto assetMetadataUpsertDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateAssetMetadataWithHttpInfo(id, assetMetadataUpsertDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<AssetMetadataResponseDto>') as List)
          .cast<AssetMetadataResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete asset metadata by key
  ///
  /// Delete a specific metadata key-value pair associated with the specified asset.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteAssetMetadataWithHttpInfo(String id, String key, {Future<void>? abortTrigger}) async {
    final apiPath = r'/assets/{id}/metadata/{key}'.replaceAll('{id}', id).replaceAll('{key}', key);

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

  /// Delete asset metadata by key
  ///
  /// Delete a specific metadata key-value pair associated with the specified asset.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteAssetMetadata(String id, String key, {Future<void>? abortTrigger}) async {
    final response = await deleteAssetMetadataWithHttpInfo(id, key, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve asset metadata by key
  ///
  /// Retrieve the value of a specific metadata key associated with the specified asset.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAssetMetadataByKeyWithHttpInfo(String id, String key, {Future<void>? abortTrigger}) async {
    final apiPath = r'/assets/{id}/metadata/{key}'.replaceAll('{id}', id).replaceAll('{key}', key);

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

  /// Retrieve asset metadata by key
  ///
  /// Retrieve the value of a specific metadata key associated with the specified asset.
  ///
  /// Available since server v1.0.0.
  Future<AssetMetadataResponseDto> getAssetMetadataByKey(String id, String key, {Future<void>? abortTrigger}) async {
    final response = await getAssetMetadataByKeyWithHttpInfo(id, key, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AssetMetadataResponseDto')
          as AssetMetadataResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve asset OCR data
  ///
  /// Retrieve all OCR (Optical Character Recognition) data associated with the specified asset.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAssetOcrWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/assets/{id}/ocr'.replaceAll('{id}', id);

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

  /// Retrieve asset OCR data
  ///
  /// Retrieve all OCR (Optical Character Recognition) data associated with the specified asset.
  ///
  /// Available since server v1.0.0.
  Future<List<AssetOcrResponseDto>> getAssetOcr(String id, {Future<void>? abortTrigger}) async {
    final response = await getAssetOcrWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<AssetOcrResponseDto>') as List)
          .cast<AssetOcrResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Download original asset
  ///
  /// Downloads the original file of the specified asset.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> downloadAssetWithHttpInfo(
    String id, {
    bool? edited,
    String? key,
    String? slug,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/assets/{id}/original'.replaceAll('{id}', id);

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (edited != null) {
      queryParams.addAll(_queryParams('', 'edited', edited));
    }
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

  /// Download original asset
  ///
  /// Downloads the original file of the specified asset.
  ///
  /// Available since server v1.0.0.
  Future<Uint8List> downloadAsset(
    String id, {
    bool? edited,
    String? key,
    String? slug,
    Future<void>? abortTrigger,
  }) async {
    final response = await downloadAssetWithHttpInfo(
      id,
      edited: edited,
      key: key,
      slug: slug,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    return response.bodyBytes;
  }

  /// View asset thumbnail
  ///
  /// Retrieve the thumbnail image for the specified asset. Viewing the fullsize thumbnail might redirect to downloadAsset, which requires a different permission.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> viewAssetWithHttpInfo(
    String id, {
    bool? edited,
    String? key,
    AssetMediaSize? size,
    String? slug,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/assets/{id}/thumbnail'.replaceAll('{id}', id);

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (edited != null) {
      queryParams.addAll(_queryParams('', 'edited', edited));
    }
    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }
    if (size != null) {
      queryParams.addAll(_queryParams('', 'size', size));
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

  /// View asset thumbnail
  ///
  /// Retrieve the thumbnail image for the specified asset. Viewing the fullsize thumbnail might redirect to downloadAsset, which requires a different permission.
  ///
  /// Available since server v1.0.0.
  Future<Uint8List> viewAsset(
    String id, {
    bool? edited,
    String? key,
    AssetMediaSize? size,
    String? slug,
    Future<void>? abortTrigger,
  }) async {
    final response = await viewAssetWithHttpInfo(
      id,
      edited: edited,
      key: key,
      size: size,
      slug: slug,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    return response.bodyBytes;
  }

  /// Play asset video
  ///
  /// Streams the video file for the specified asset. This endpoint also supports byte range requests.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> playAssetVideoWithHttpInfo(
    String id, {
    String? key,
    String? slug,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/assets/{id}/video/playback'.replaceAll('{id}', id);

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

  /// Play asset video
  ///
  /// Streams the video file for the specified asset. This endpoint also supports byte range requests.
  ///
  /// Available since server v1.0.0.
  Future<Uint8List> playAssetVideo(String id, {String? key, String? slug, Future<void>? abortTrigger}) async {
    final response = await playAssetVideoWithHttpInfo(id, key: key, slug: slug, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    return response.bodyBytes;
  }
}
