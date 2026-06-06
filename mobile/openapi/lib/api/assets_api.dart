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
  Future<Response> checkBulkUploadWithHttpInfo(AssetBulkUploadCheckDto assetBulkUploadCheckDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Check bulk upload
  ///
  /// Determine which assets have already been uploaded to the server based on their SHA1 checksums.
  ///
  /// Parameters:
  ///
  /// * [AssetBulkUploadCheckDto] assetBulkUploadCheckDto (required):
  Future<AssetBulkUploadCheckResponseDto?> checkBulkUpload(AssetBulkUploadCheckDto assetBulkUploadCheckDto, { Future<void>? abortTrigger, }) async {
    final response = await checkBulkUploadWithHttpInfo(assetBulkUploadCheckDto, abortTrigger: abortTrigger,);
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

  /// Copy asset
  ///
  /// Copy asset information like albums, tags, etc. from one asset to another.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [AssetCopyDto] assetCopyDto (required):
  Future<Response> copyAssetWithHttpInfo(AssetCopyDto assetCopyDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Copy asset
  ///
  /// Copy asset information like albums, tags, etc. from one asset to another.
  ///
  /// Parameters:
  ///
  /// * [AssetCopyDto] assetCopyDto (required):
  Future<void> copyAsset(AssetCopyDto assetCopyDto, { Future<void>? abortTrigger, }) async {
    final response = await copyAssetWithHttpInfo(assetCopyDto, abortTrigger: abortTrigger,);
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
  ///   Asset ID
  ///
  /// * [String] key (required):
  ///   Metadata key
  Future<Response> deleteAssetMetadataWithHttpInfo(String id, String key, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Delete asset metadata by key
  ///
  /// Delete a specific metadata key-value pair associated with the specified asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///   Asset ID
  ///
  /// * [String] key (required):
  ///   Metadata key
  Future<void> deleteAssetMetadata(String id, String key, { Future<void>? abortTrigger, }) async {
    final response = await deleteAssetMetadataWithHttpInfo(id, key, abortTrigger: abortTrigger,);
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
  Future<Response> deleteAssetsWithHttpInfo(AssetBulkDeleteDto assetBulkDeleteDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Delete assets
  ///
  /// Deletes multiple assets at the same time.
  ///
  /// Parameters:
  ///
  /// * [AssetBulkDeleteDto] assetBulkDeleteDto (required):
  Future<void> deleteAssets(AssetBulkDeleteDto assetBulkDeleteDto, { Future<void>? abortTrigger, }) async {
    final response = await deleteAssetsWithHttpInfo(assetBulkDeleteDto, abortTrigger: abortTrigger,);
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
  Future<Response> deleteBulkAssetMetadataWithHttpInfo(AssetMetadataBulkDeleteDto assetMetadataBulkDeleteDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Delete asset metadata
  ///
  /// Delete metadata key-value pairs for multiple assets.
  ///
  /// Parameters:
  ///
  /// * [AssetMetadataBulkDeleteDto] assetMetadataBulkDeleteDto (required):
  Future<void> deleteBulkAssetMetadata(AssetMetadataBulkDeleteDto assetMetadataBulkDeleteDto, { Future<void>? abortTrigger, }) async {
    final response = await deleteBulkAssetMetadataWithHttpInfo(assetMetadataBulkDeleteDto, abortTrigger: abortTrigger,);
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
  /// * [bool] edited:
  ///   Return edited asset if available
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> downloadAssetWithHttpInfo(String id, { bool? edited, String? key, String? slug, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/original'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
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
      'GET',
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
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [bool] edited:
  ///   Return edited asset if available
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<MultipartFile?> downloadAsset(String id, { bool? edited, String? key, String? slug, Future<void>? abortTrigger, }) async {
    final response = await downloadAssetWithHttpInfo(id, edited: edited, key: key, slug: slug, abortTrigger: abortTrigger,);
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

  /// Apply edits to an existing asset
  ///
  /// Apply a series of edit actions (crop, rotate, mirror) to the specified asset.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AssetEditsCreateDto] assetEditsCreateDto (required):
  Future<Response> editAssetWithHttpInfo(String id, AssetEditsCreateDto assetEditsCreateDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/edits'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = assetEditsCreateDto;

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

  /// Apply edits to an existing asset
  ///
  /// Apply a series of edit actions (crop, rotate, mirror) to the specified asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AssetEditsCreateDto] assetEditsCreateDto (required):
  Future<AssetEditsResponseDto?> editAsset(String id, AssetEditsCreateDto assetEditsCreateDto, { Future<void>? abortTrigger, }) async {
    final response = await editAssetWithHttpInfo(id, assetEditsCreateDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetEditsResponseDto',) as AssetEditsResponseDto;
    
    }
    return null;
  }

  /// End HLS streaming session
  ///
  /// Releases server resources for the streaming session.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] sessionId (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> endSessionWithHttpInfo(String id, String sessionId, { String? key, String? slug, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/video/stream/{sessionId}'
      .replaceAll('{id}', id)
      .replaceAll('{sessionId}', sessionId);

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
      'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// End HLS streaming session
  ///
  /// Releases server resources for the streaming session.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] sessionId (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<void> endSession(String id, String sessionId, { String? key, String? slug, Future<void>? abortTrigger, }) async {
    final response = await endSessionWithHttpInfo(id, sessionId, key: key, slug: slug, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve edits for an existing asset
  ///
  /// Retrieve a series of edit actions (crop, rotate, mirror) associated with the specified asset.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getAssetEditsWithHttpInfo(String id, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/edits'
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
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve edits for an existing asset
  ///
  /// Retrieve a series of edit actions (crop, rotate, mirror) associated with the specified asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<AssetEditsResponseDto?> getAssetEdits(String id, { Future<void>? abortTrigger, }) async {
    final response = await getAssetEditsWithHttpInfo(id, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetEditsResponseDto',) as AssetEditsResponseDto;
    
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
  Future<Response> getAssetInfoWithHttpInfo(String id, { String? key, String? slug, Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
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
  Future<AssetResponseDto?> getAssetInfo(String id, { String? key, String? slug, Future<void>? abortTrigger, }) async {
    final response = await getAssetInfoWithHttpInfo(id, key: key, slug: slug, abortTrigger: abortTrigger,);
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
  Future<Response> getAssetMetadataWithHttpInfo(String id, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Get asset metadata
  ///
  /// Retrieve all metadata key-value pairs associated with the specified asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<List<AssetMetadataResponseDto>?> getAssetMetadata(String id, { Future<void>? abortTrigger, }) async {
    final response = await getAssetMetadataWithHttpInfo(id, abortTrigger: abortTrigger,);
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
  ///   Asset ID
  ///
  /// * [String] key (required):
  ///   Metadata key
  Future<Response> getAssetMetadataByKeyWithHttpInfo(String id, String key, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve asset metadata by key
  ///
  /// Retrieve the value of a specific metadata key associated with the specified asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///   Asset ID
  ///
  /// * [String] key (required):
  ///   Metadata key
  Future<AssetMetadataResponseDto?> getAssetMetadataByKey(String id, String key, { Future<void>? abortTrigger, }) async {
    final response = await getAssetMetadataByKeyWithHttpInfo(id, key, abortTrigger: abortTrigger,);
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
  Future<Response> getAssetOcrWithHttpInfo(String id, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve asset OCR data
  ///
  /// Retrieve all OCR (Optical Character Recognition) data associated with the specified asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<List<AssetOcrResponseDto>?> getAssetOcr(String id, { Future<void>? abortTrigger, }) async {
    final response = await getAssetOcrWithHttpInfo(id, abortTrigger: abortTrigger,);
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
  ///   Filter by favorite status
  ///
  /// * [bool] isTrashed:
  ///   Filter by trash status
  ///
  /// * [AssetVisibility] visibility:
  Future<Response> getAssetStatisticsWithHttpInfo({ bool? isFavorite, bool? isTrashed, AssetVisibility? visibility, Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Get asset statistics
  ///
  /// Retrieve various statistics about the assets owned by the authenticated user.
  ///
  /// Parameters:
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status
  ///
  /// * [bool] isTrashed:
  ///   Filter by trash status
  ///
  /// * [AssetVisibility] visibility:
  Future<AssetStatsResponseDto?> getAssetStatistics({ bool? isFavorite, bool? isTrashed, AssetVisibility? visibility, Future<void>? abortTrigger, }) async {
    final response = await getAssetStatisticsWithHttpInfo(isFavorite: isFavorite, isTrashed: isTrashed, visibility: visibility, abortTrigger: abortTrigger,);
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

  /// Get HLS main playlist
  ///
  /// Returns an HLS main playlist with all available variants for the asset.
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
  Future<Response> getMainPlaylistWithHttpInfo(String id, { String? key, String? slug, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/video/stream/main.m3u8'
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

  /// Get HLS main playlist
  ///
  /// Returns an HLS main playlist with all available variants for the asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<String?> getMainPlaylist(String id, { String? key, String? slug, Future<void>? abortTrigger, }) async {
    final response = await getMainPlaylistWithHttpInfo(id, key: key, slug: slug, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'String',) as String;
    
    }
    return null;
  }

  /// Get HLS media playlist
  ///
  /// Returns an HLS media playlist for one variant of the streaming session.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] sessionId (required):
  ///
  /// * [int] variantIndex (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> getMediaPlaylistWithHttpInfo(String id, String sessionId, int variantIndex, { String? key, String? slug, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/video/stream/{sessionId}/{variantIndex}/playlist.m3u8'
      .replaceAll('{id}', id)
      .replaceAll('{sessionId}', sessionId)
      .replaceAll('{variantIndex}', variantIndex.toString());

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

  /// Get HLS media playlist
  ///
  /// Returns an HLS media playlist for one variant of the streaming session.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] sessionId (required):
  ///
  /// * [int] variantIndex (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<String?> getMediaPlaylist(String id, String sessionId, int variantIndex, { String? key, String? slug, Future<void>? abortTrigger, }) async {
    final response = await getMediaPlaylistWithHttpInfo(id, sessionId, variantIndex, key: key, slug: slug, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'String',) as String;
    
    }
    return null;
  }

  /// Get HLS segment or init file
  ///
  /// Streams an HLS init segment (init.mp4) or media segment (seg_N.m4s).
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] filename (required):
  ///
  /// * [String] id (required):
  ///
  /// * [String] sessionId (required):
  ///
  /// * [int] variantIndex (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> getSegmentWithHttpInfo(String filename, String id, String sessionId, int variantIndex, { String? key, String? slug, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/video/stream/{sessionId}/{variantIndex}/{filename}'
      .replaceAll('{filename}', filename)
      .replaceAll('{id}', id)
      .replaceAll('{sessionId}', sessionId)
      .replaceAll('{variantIndex}', variantIndex.toString());

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

  /// Get HLS segment or init file
  ///
  /// Streams an HLS init segment (init.mp4) or media segment (seg_N.m4s).
  ///
  /// Parameters:
  ///
  /// * [String] filename (required):
  ///
  /// * [String] id (required):
  ///
  /// * [String] sessionId (required):
  ///
  /// * [int] variantIndex (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<MultipartFile?> getSegment(String filename, String id, String sessionId, int variantIndex, { String? key, String? slug, Future<void>? abortTrigger, }) async {
    final response = await getSegmentWithHttpInfo(filename, id, sessionId, variantIndex, key: key, slug: slug, abortTrigger: abortTrigger,);
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
  Future<Response> playAssetVideoWithHttpInfo(String id, { String? key, String? slug, Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
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
  Future<MultipartFile?> playAssetVideo(String id, { String? key, String? slug, Future<void>? abortTrigger, }) async {
    final response = await playAssetVideoWithHttpInfo(id, key: key, slug: slug, abortTrigger: abortTrigger,);
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

  /// Remove edits from an existing asset
  ///
  /// Removes all edit actions (crop, rotate, mirror) associated with the specified asset.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> removeAssetEditsWithHttpInfo(String id, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/edits'
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

  /// Remove edits from an existing asset
  ///
  /// Removes all edit actions (crop, rotate, mirror) associated with the specified asset.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> removeAssetEdits(String id, { Future<void>? abortTrigger, }) async {
    final response = await removeAssetEditsWithHttpInfo(id, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
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
  Future<Response> runAssetJobsWithHttpInfo(AssetJobsDto assetJobsDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Run an asset job
  ///
  /// Run a specific job on a set of assets.
  ///
  /// Parameters:
  ///
  /// * [AssetJobsDto] assetJobsDto (required):
  Future<void> runAssetJobs(AssetJobsDto assetJobsDto, { Future<void>? abortTrigger, }) async {
    final response = await runAssetJobsWithHttpInfo(assetJobsDto, abortTrigger: abortTrigger,);
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
  Future<Response> updateAssetWithHttpInfo(String id, UpdateAssetDto updateAssetDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
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
  Future<AssetResponseDto?> updateAsset(String id, UpdateAssetDto updateAssetDto, { Future<void>? abortTrigger, }) async {
    final response = await updateAssetWithHttpInfo(id, updateAssetDto, abortTrigger: abortTrigger,);
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
  Future<Response> updateAssetMetadataWithHttpInfo(String id, AssetMetadataUpsertDto assetMetadataUpsertDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
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
  Future<List<AssetMetadataResponseDto>?> updateAssetMetadata(String id, AssetMetadataUpsertDto assetMetadataUpsertDto, { Future<void>? abortTrigger, }) async {
    final response = await updateAssetMetadataWithHttpInfo(id, assetMetadataUpsertDto, abortTrigger: abortTrigger,);
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
  Future<Response> updateAssetsWithHttpInfo(AssetBulkUpdateDto assetBulkUpdateDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Update assets
  ///
  /// Updates multiple assets at the same time.
  ///
  /// Parameters:
  ///
  /// * [AssetBulkUpdateDto] assetBulkUpdateDto (required):
  Future<void> updateAssets(AssetBulkUpdateDto assetBulkUpdateDto, { Future<void>? abortTrigger, }) async {
    final response = await updateAssetsWithHttpInfo(assetBulkUpdateDto, abortTrigger: abortTrigger,);
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
  Future<Response> updateBulkAssetMetadataWithHttpInfo(AssetMetadataBulkUpsertDto assetMetadataBulkUpsertDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Upsert asset metadata
  ///
  /// Upsert metadata key-value pairs for multiple assets.
  ///
  /// Parameters:
  ///
  /// * [AssetMetadataBulkUpsertDto] assetMetadataBulkUpsertDto (required):
  Future<List<AssetMetadataBulkResponseDto>?> updateBulkAssetMetadata(AssetMetadataBulkUpsertDto assetMetadataBulkUpsertDto, { Future<void>? abortTrigger, }) async {
    final response = await updateBulkAssetMetadataWithHttpInfo(assetMetadataBulkUpsertDto, abortTrigger: abortTrigger,);
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
  ///   Asset file data
  ///
  /// * [DateTime] fileCreatedAt (required):
  ///   File creation date
  ///
  /// * [DateTime] fileModifiedAt (required):
  ///   File modification date
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  ///
  /// * [String] xImmichChecksum:
  ///   sha1 checksum that can be used for duplicate detection before the file is uploaded
  ///
  /// * [int] duration:
  ///   Duration in milliseconds (for videos)
  ///
  /// * [String] filename:
  ///   Filename
  ///
  /// * [bool] isFavorite:
  ///   Mark as favorite
  ///
  /// * [String] livePhotoVideoId:
  ///   Live photo video ID
  ///
  /// * [List<AssetMetadataUpsertItemDto>] metadata:
  ///   Asset metadata items
  ///
  /// * [MultipartFile] sidecarData:
  ///   Sidecar file data
  ///
  /// * [AssetVisibility] visibility:
  Future<Response> uploadAssetWithHttpInfo(MultipartFile assetData, DateTime fileCreatedAt, DateTime fileModifiedAt, { String? key, String? slug, String? xImmichChecksum, int? duration, String? filename, bool? isFavorite, String? livePhotoVideoId, List<AssetMetadataUpsertItemDto>? metadata, MultipartFile? sidecarData, AssetVisibility? visibility, Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Upload asset
  ///
  /// Uploads a new asset to the server.
  ///
  /// Parameters:
  ///
  /// * [MultipartFile] assetData (required):
  ///   Asset file data
  ///
  /// * [DateTime] fileCreatedAt (required):
  ///   File creation date
  ///
  /// * [DateTime] fileModifiedAt (required):
  ///   File modification date
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  ///
  /// * [String] xImmichChecksum:
  ///   sha1 checksum that can be used for duplicate detection before the file is uploaded
  ///
  /// * [int] duration:
  ///   Duration in milliseconds (for videos)
  ///
  /// * [String] filename:
  ///   Filename
  ///
  /// * [bool] isFavorite:
  ///   Mark as favorite
  ///
  /// * [String] livePhotoVideoId:
  ///   Live photo video ID
  ///
  /// * [List<AssetMetadataUpsertItemDto>] metadata:
  ///   Asset metadata items
  ///
  /// * [MultipartFile] sidecarData:
  ///   Sidecar file data
  ///
  /// * [AssetVisibility] visibility:
  Future<AssetMediaResponseDto?> uploadAsset(MultipartFile assetData, DateTime fileCreatedAt, DateTime fileModifiedAt, { String? key, String? slug, String? xImmichChecksum, int? duration, String? filename, bool? isFavorite, String? livePhotoVideoId, List<AssetMetadataUpsertItemDto>? metadata, MultipartFile? sidecarData, AssetVisibility? visibility, Future<void>? abortTrigger, }) async {
    final response = await uploadAssetWithHttpInfo(assetData, fileCreatedAt, fileModifiedAt, key: key, slug: slug, xImmichChecksum: xImmichChecksum, duration: duration, filename: filename, isFavorite: isFavorite, livePhotoVideoId: livePhotoVideoId, metadata: metadata, sidecarData: sidecarData, visibility: visibility, abortTrigger: abortTrigger,);
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
  /// Retrieve the thumbnail image for the specified asset. Viewing the fullsize thumbnail might redirect to downloadAsset, which requires a different permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [bool] edited:
  ///   Return edited asset if available
  ///
  /// * [String] key:
  ///
  /// * [AssetMediaSize] size:
  ///
  /// * [String] slug:
  Future<Response> viewAssetWithHttpInfo(String id, { bool? edited, String? key, AssetMediaSize? size, String? slug, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/assets/{id}/thumbnail'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
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
      'GET',
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
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [bool] edited:
  ///   Return edited asset if available
  ///
  /// * [String] key:
  ///
  /// * [AssetMediaSize] size:
  ///
  /// * [String] slug:
  Future<MultipartFile?> viewAsset(String id, { bool? edited, String? key, AssetMediaSize? size, String? slug, Future<void>? abortTrigger, }) async {
    final response = await viewAssetWithHttpInfo(id, edited: edited, key: key, size: size, slug: slug, abortTrigger: abortTrigger,);
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
