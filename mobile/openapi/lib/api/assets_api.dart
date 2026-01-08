//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class AssetsApi {
  AssetsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Check bulk upload
  ///
  /// Determine which assets have already been uploaded to the server based on their SHA1 checksums.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [AssetBulkUploadCheckDto] assetBulkUploadCheckDto (required):
  Future<Response> checkBulkUploadWithHttpInfo(AssetBulkUploadCheckDto assetBulkUploadCheckDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/bulk-upload-check';

    // ignore: prefer_final_locals
    Object? postBody = assetBulkUploadCheckDto;

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

  /// Check bulk upload
  ///
  /// Determine which assets have already been uploaded to the server based on their SHA1 checksums.
  ///
  /// Parameters:
  ///
  /// * [AssetBulkUploadCheckDto] assetBulkUploadCheckDto (required):
  Future<AssetBulkUploadCheckResponseDto?> checkBulkUpload(AssetBulkUploadCheckDto assetBulkUploadCheckDto,) async {
    final response = await checkBulkUploadWithHttpInfo(assetBulkUploadCheckDto,);
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

  /// Check existing assets
  ///
  /// Checks if multiple assets exist on the server and returns all existing - used by background backup
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [CheckExistingAssetsDto] checkExistingAssetsDto (required):
  Future<Response> checkExistingAssetsWithHttpInfo(CheckExistingAssetsDto checkExistingAssetsDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/exist';

    // ignore: prefer_final_locals
    Object? postBody = checkExistingAssetsDto;

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

  /// Check existing assets
  ///
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

  /// Copy asset
  ///
  /// Copy asset information like albums, tags, etc. from one asset to another.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [AssetCopyDto] assetCopyDto (required):
  Future<Response> copyAssetWithHttpInfo(AssetCopyDto assetCopyDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/copy';

    // ignore: prefer_final_locals
    Object? postBody = assetCopyDto;

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

  /// Copy asset
  ///
  /// Copy asset information like albums, tags, etc. from one asset to another.
  ///
  /// Parameters:
  ///
  /// * [AssetCopyDto] assetCopyDto (required):
  Future<void> copyAsset(AssetCopyDto assetCopyDto,) async {
    final response = await copyAssetWithHttpInfo(assetCopyDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Delete asset metadata by key
  ///
  /// Delete a specific metadata key-value pair associated with the specified asset.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key (required):
  Future<Response> deleteAssetMetadataWithHttpInfo(String id, String key,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/metadata/{key}'
      .replaceAll('{id}', id)
      .replaceAll('{key}', key);

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

  /// Delete asset metadata by key
  ///
  /// Delete a specific metadata key-value pair associated with the specified asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key (required):
  Future<void> deleteAssetMetadata(String id, String key,) async {
    final response = await deleteAssetMetadataWithHttpInfo(id, key,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Delete assets
  ///
  /// Deletes multiple assets at the same time.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [AssetBulkDeleteDto] assetBulkDeleteDto (required):
  Future<Response> deleteAssetsWithHttpInfo(AssetBulkDeleteDto assetBulkDeleteDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets';

    // ignore: prefer_final_locals
    Object? postBody = assetBulkDeleteDto;

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

  /// Delete assets
  ///
  /// Deletes multiple assets at the same time.
  ///
  /// Parameters:
  ///
  /// * [AssetBulkDeleteDto] assetBulkDeleteDto (required):
  Future<void> deleteAssets(AssetBulkDeleteDto assetBulkDeleteDto,) async {
    final response = await deleteAssetsWithHttpInfo(assetBulkDeleteDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Delete asset metadata
  ///
  /// Delete metadata key-value pairs for multiple assets.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [AssetMetadataBulkDeleteDto] assetMetadataBulkDeleteDto (required):
  Future<Response> deleteBulkAssetMetadataWithHttpInfo(AssetMetadataBulkDeleteDto assetMetadataBulkDeleteDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/metadata';

    // ignore: prefer_final_locals
    Object? postBody = assetMetadataBulkDeleteDto;

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

  /// Delete asset metadata
  ///
  /// Delete metadata key-value pairs for multiple assets.
  ///
  /// Parameters:
  ///
  /// * [AssetMetadataBulkDeleteDto] assetMetadataBulkDeleteDto (required):
  Future<void> deleteBulkAssetMetadata(AssetMetadataBulkDeleteDto assetMetadataBulkDeleteDto,) async {
    final response = await deleteBulkAssetMetadataWithHttpInfo(assetMetadataBulkDeleteDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Download original asset
  ///
  /// Downloads the original file of the specified asset.
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
  Future<Response> downloadAssetWithHttpInfo(String id, { String? key, String? slug, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/original'
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
    );
  }

  /// Download original asset
  ///
  /// Downloads the original file of the specified asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<MultipartFile?> downloadAsset(String id, { String? key, String? slug, }) async {
    final response = await downloadAssetWithHttpInfo(id,  key: key, slug: slug, );
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

  /// Retrieve assets by device ID
  ///
  /// Get all asset of a device that are in the database, ID only.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] deviceId (required):
  Future<Response> getAllUserAssetsByDeviceIdWithHttpInfo(String deviceId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/device/{deviceId}'
      .replaceAll('{deviceId}', deviceId);

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

  /// Retrieve assets by device ID
  ///
  /// Get all asset of a device that are in the database, ID only.
  ///
  /// Parameters:
  ///
  /// * [String] deviceId (required):
  Future<List<String>?> getAllUserAssetsByDeviceId(String deviceId,) async {
    final response = await getAllUserAssetsByDeviceIdWithHttpInfo(deviceId,);
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
        .toList(growable: false);

    }
    return null;
  }

  /// Retrieve an asset
  ///
  /// Retrieve detailed information about a specific asset.
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
  Future<Response> getAssetInfoWithHttpInfo(String id, { String? key, String? slug, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}'
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
    );
  }

  /// Retrieve an asset
  ///
  /// Retrieve detailed information about a specific asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<AssetResponseDto?> getAssetInfo(String id, { String? key, String? slug, }) async {
    final response = await getAssetInfoWithHttpInfo(id,  key: key, slug: slug, );
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

  /// Get asset metadata
  ///
  /// Retrieve all metadata key-value pairs associated with the specified asset.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getAssetMetadataWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/metadata'
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

  /// Get asset metadata
  ///
  /// Retrieve all metadata key-value pairs associated with the specified asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<List<AssetMetadataResponseDto>?> getAssetMetadata(String id,) async {
    final response = await getAssetMetadataWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AssetMetadataResponseDto>') as List)
        .cast<AssetMetadataResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Retrieve asset metadata by key
  ///
  /// Retrieve the value of a specific metadata key associated with the specified asset.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key (required):
  Future<Response> getAssetMetadataByKeyWithHttpInfo(String id, String key,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/metadata/{key}'
      .replaceAll('{id}', id)
      .replaceAll('{key}', key);

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

  /// Retrieve asset metadata by key
  ///
  /// Retrieve the value of a specific metadata key associated with the specified asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key (required):
  Future<AssetMetadataResponseDto?> getAssetMetadataByKey(String id, String key,) async {
    final response = await getAssetMetadataByKeyWithHttpInfo(id, key,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetMetadataResponseDto',) as AssetMetadataResponseDto;
    
    }
    return null;
  }

  /// Retrieve asset OCR data
  ///
  /// Retrieve all OCR (Optical Character Recognition) data associated with the specified asset.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getAssetOcrWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/ocr'
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

  /// Retrieve asset OCR data
  ///
  /// Retrieve all OCR (Optical Character Recognition) data associated with the specified asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<List<AssetOcrResponseDto>?> getAssetOcr(String id,) async {
    final response = await getAssetOcrWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AssetOcrResponseDto>') as List)
        .cast<AssetOcrResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Get asset statistics
  ///
  /// Retrieve various statistics about the assets owned by the authenticated user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isTrashed:
  ///
  /// * [AssetVisibility] visibility:
  Future<Response> getAssetStatisticsWithHttpInfo({ bool? isFavorite, bool? isTrashed, AssetVisibility? visibility, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/statistics';

    // ignore: prefer_final_locals
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
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Get asset statistics
  ///
  /// Retrieve various statistics about the assets owned by the authenticated user.
  ///
  /// Parameters:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [bool] isTrashed:
  ///
  /// * [AssetVisibility] visibility:
  Future<AssetStatsResponseDto?> getAssetStatistics({ bool? isFavorite, bool? isTrashed, AssetVisibility? visibility, }) async {
    final response = await getAssetStatisticsWithHttpInfo( isFavorite: isFavorite, isTrashed: isTrashed, visibility: visibility, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetStatsResponseDto',) as AssetStatsResponseDto;
    
    }
    return null;
  }

  /// Get random assets
  ///
  /// Retrieve a specified number of random assets for the authenticated user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [num] count:
  Future<Response> getRandomWithHttpInfo({ num? count, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/random';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (count != null) {
      queryParams.addAll(_queryParams('', 'count', count));
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

  /// Get random assets
  ///
  /// Retrieve a specified number of random assets for the authenticated user.
  ///
  /// Parameters:
  ///
  /// * [num] count:
  Future<List<AssetResponseDto>?> getRandom({ num? count, }) async {
    final response = await getRandomWithHttpInfo( count: count, );
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
        .toList(growable: false);

    }
    return null;
  }

  /// Play asset video
  ///
  /// Streams the video file for the specified asset. This endpoint also supports byte range requests.
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
  Future<Response> playAssetVideoWithHttpInfo(String id, { String? key, String? slug, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/video/playback'
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
    );
  }

  /// Play asset video
  ///
  /// Streams the video file for the specified asset. This endpoint also supports byte range requests.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<MultipartFile?> playAssetVideo(String id, { String? key, String? slug, }) async {
    final response = await playAssetVideoWithHttpInfo(id,  key: key, slug: slug, );
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

  /// Replace asset
  ///
  /// Replace the asset with new file, without changing its id.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
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
  /// * [String] key:
  ///
  /// * [String] slug:
  ///
  /// * [String] duration:
  ///
  /// * [String] filename:
  Future<Response> replaceAssetWithHttpInfo(String id, MultipartFile assetData, String deviceAssetId, String deviceId, DateTime fileCreatedAt, DateTime fileModifiedAt, { String? key, String? slug, String? duration, String? filename, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/original'
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

    const contentTypes = <String>['multipart/form-data'];

    bool hasFields = false;
    final mp = MultipartRequest('PUT', Uri.parse(apiPath));
    if (assetData != null) {
      hasFields = true;
      mp.fields[r'assetData'] = assetData.field;
      mp.files.add(assetData);
    }
    if (deviceAssetId != null) {
      hasFields = true;
      mp.fields[r'deviceAssetId'] = parameterToString(deviceAssetId);
    }
    if (deviceId != null) {
      hasFields = true;
      mp.fields[r'deviceId'] = parameterToString(deviceId);
    }
    if (duration != null) {
      hasFields = true;
      mp.fields[r'duration'] = parameterToString(duration);
    }
    if (fileCreatedAt != null) {
      hasFields = true;
      mp.fields[r'fileCreatedAt'] = parameterToString(fileCreatedAt);
    }
    if (fileModifiedAt != null) {
      hasFields = true;
      mp.fields[r'fileModifiedAt'] = parameterToString(fileModifiedAt);
    }
    if (filename != null) {
      hasFields = true;
      mp.fields[r'filename'] = parameterToString(filename);
    }
    if (hasFields) {
      postBody = mp;
    }

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

  /// Replace asset
  ///
  /// Replace the asset with new file, without changing its id.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
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
  /// * [String] key:
  ///
  /// * [String] slug:
  ///
  /// * [String] duration:
  ///
  /// * [String] filename:
  Future<AssetMediaResponseDto?> replaceAsset(String id, MultipartFile assetData, String deviceAssetId, String deviceId, DateTime fileCreatedAt, DateTime fileModifiedAt, { String? key, String? slug, String? duration, String? filename, }) async {
    final response = await replaceAssetWithHttpInfo(id, assetData, deviceAssetId, deviceId, fileCreatedAt, fileModifiedAt,  key: key, slug: slug, duration: duration, filename: filename, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetMediaResponseDto',) as AssetMediaResponseDto;
    
    }
    return null;
  }

  /// Run an asset job
  ///
  /// Run a specific job on a set of assets.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [AssetJobsDto] assetJobsDto (required):
  Future<Response> runAssetJobsWithHttpInfo(AssetJobsDto assetJobsDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/jobs';

    // ignore: prefer_final_locals
    Object? postBody = assetJobsDto;

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

  /// Run an asset job
  ///
  /// Run a specific job on a set of assets.
  ///
  /// Parameters:
  ///
  /// * [AssetJobsDto] assetJobsDto (required):
  Future<void> runAssetJobs(AssetJobsDto assetJobsDto,) async {
    final response = await runAssetJobsWithHttpInfo(assetJobsDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Update an asset
  ///
  /// Update information of a specific asset.
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
    final apiPath = r'/assets/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = updateAssetDto;

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

  /// Update an asset
  ///
  /// Update information of a specific asset.
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

  /// Update asset metadata
  ///
  /// Update or add metadata key-value pairs for the specified asset.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AssetMetadataUpsertDto] assetMetadataUpsertDto (required):
  Future<Response> updateAssetMetadataWithHttpInfo(String id, AssetMetadataUpsertDto assetMetadataUpsertDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/metadata'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = assetMetadataUpsertDto;

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

  /// Update asset metadata
  ///
  /// Update or add metadata key-value pairs for the specified asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AssetMetadataUpsertDto] assetMetadataUpsertDto (required):
  Future<List<AssetMetadataResponseDto>?> updateAssetMetadata(String id, AssetMetadataUpsertDto assetMetadataUpsertDto,) async {
    final response = await updateAssetMetadataWithHttpInfo(id, assetMetadataUpsertDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AssetMetadataResponseDto>') as List)
        .cast<AssetMetadataResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Update assets
  ///
  /// Updates multiple assets at the same time.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [AssetBulkUpdateDto] assetBulkUpdateDto (required):
  Future<Response> updateAssetsWithHttpInfo(AssetBulkUpdateDto assetBulkUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets';

    // ignore: prefer_final_locals
    Object? postBody = assetBulkUpdateDto;

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

  /// Update assets
  ///
  /// Updates multiple assets at the same time.
  ///
  /// Parameters:
  ///
  /// * [AssetBulkUpdateDto] assetBulkUpdateDto (required):
  Future<void> updateAssets(AssetBulkUpdateDto assetBulkUpdateDto,) async {
    final response = await updateAssetsWithHttpInfo(assetBulkUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Upsert asset metadata
  ///
  /// Upsert metadata key-value pairs for multiple assets.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [AssetMetadataBulkUpsertDto] assetMetadataBulkUpsertDto (required):
  Future<Response> updateBulkAssetMetadataWithHttpInfo(AssetMetadataBulkUpsertDto assetMetadataBulkUpsertDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/metadata';

    // ignore: prefer_final_locals
    Object? postBody = assetMetadataBulkUpsertDto;

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

  /// Upsert asset metadata
  ///
  /// Upsert metadata key-value pairs for multiple assets.
  ///
  /// Parameters:
  ///
  /// * [AssetMetadataBulkUpsertDto] assetMetadataBulkUpsertDto (required):
  Future<List<AssetMetadataBulkResponseDto>?> updateBulkAssetMetadata(AssetMetadataBulkUpsertDto assetMetadataBulkUpsertDto,) async {
    final response = await updateBulkAssetMetadataWithHttpInfo(assetMetadataBulkUpsertDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AssetMetadataBulkResponseDto>') as List)
        .cast<AssetMetadataBulkResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Upload asset
  ///
  /// Uploads a new asset to the server.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
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
  /// * [List<AssetMetadataUpsertItemDto>] metadata (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  ///
  /// * [String] xImmichChecksum:
  ///   sha1 checksum that can be used for duplicate detection before the file is uploaded
  ///
  /// * [String] duration:
  ///
  /// * [String] filename:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [String] livePhotoVideoId:
  ///
  /// * [MultipartFile] sidecarData:
  ///
  /// * [AssetVisibility] visibility:
  Future<Response> uploadAssetWithHttpInfo(MultipartFile assetData, String deviceAssetId, String deviceId, DateTime fileCreatedAt, DateTime fileModifiedAt, List<AssetMetadataUpsertItemDto> metadata, { String? key, String? slug, String? xImmichChecksum, String? duration, String? filename, bool? isFavorite, String? livePhotoVideoId, MultipartFile? sidecarData, AssetVisibility? visibility, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets';

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

    if (xImmichChecksum != null) {
      headerParams[r'x-immich-checksum'] = parameterToString(xImmichChecksum);
    }

    const contentTypes = <String>['multipart/form-data'];

    bool hasFields = false;
    final mp = MultipartRequest('POST', Uri.parse(apiPath));
    if (assetData != null) {
      hasFields = true;
      mp.fields[r'assetData'] = assetData.field;
      mp.files.add(assetData);
    }
    if (deviceAssetId != null) {
      hasFields = true;
      mp.fields[r'deviceAssetId'] = parameterToString(deviceAssetId);
    }
    if (deviceId != null) {
      hasFields = true;
      mp.fields[r'deviceId'] = parameterToString(deviceId);
    }
    if (duration != null) {
      hasFields = true;
      mp.fields[r'duration'] = parameterToString(duration);
    }
    if (fileCreatedAt != null) {
      hasFields = true;
      mp.fields[r'fileCreatedAt'] = parameterToString(fileCreatedAt);
    }
    if (fileModifiedAt != null) {
      hasFields = true;
      mp.fields[r'fileModifiedAt'] = parameterToString(fileModifiedAt);
    }
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
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Upload asset
  ///
  /// Uploads a new asset to the server.
  ///
  /// Parameters:
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
  /// * [List<AssetMetadataUpsertItemDto>] metadata (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  ///
  /// * [String] xImmichChecksum:
  ///   sha1 checksum that can be used for duplicate detection before the file is uploaded
  ///
  /// * [String] duration:
  ///
  /// * [String] filename:
  ///
  /// * [bool] isFavorite:
  ///
  /// * [String] livePhotoVideoId:
  ///
  /// * [MultipartFile] sidecarData:
  ///
  /// * [AssetVisibility] visibility:
  Future<AssetMediaResponseDto?> uploadAsset(MultipartFile assetData, String deviceAssetId, String deviceId, DateTime fileCreatedAt, DateTime fileModifiedAt, List<AssetMetadataUpsertItemDto> metadata, { String? key, String? slug, String? xImmichChecksum, String? duration, String? filename, bool? isFavorite, String? livePhotoVideoId, MultipartFile? sidecarData, AssetVisibility? visibility, }) async {
    final response = await uploadAssetWithHttpInfo(assetData, deviceAssetId, deviceId, fileCreatedAt, fileModifiedAt, metadata,  key: key, slug: slug, xImmichChecksum: xImmichChecksum, duration: duration, filename: filename, isFavorite: isFavorite, livePhotoVideoId: livePhotoVideoId, sidecarData: sidecarData, visibility: visibility, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetMediaResponseDto',) as AssetMediaResponseDto;
    
    }
    return null;
  }

  /// View asset thumbnail
  ///
  /// Retrieve the thumbnail image for the specified asset.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [AssetMediaSize] size:
  ///
  /// * [String] slug:
  Future<Response> viewAssetWithHttpInfo(String id, { String? key, AssetMediaSize? size, String? slug, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/thumbnail'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

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
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// View asset thumbnail
  ///
  /// Retrieve the thumbnail image for the specified asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [AssetMediaSize] size:
  ///
  /// * [String] slug:
  Future<MultipartFile?> viewAsset(String id, { String? key, AssetMediaSize? size, String? slug, }) async {
    final response = await viewAssetWithHttpInfo(id,  key: key, size: size, slug: slug, );
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
}
