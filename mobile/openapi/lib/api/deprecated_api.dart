//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class DeprecatedApi {
  DeprecatedApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create a partner
  ///
  /// Create a new partner to share assets with.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> createPartnerDeprecatedWithHttpInfo(String id, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/partners/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


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

  /// Create a partner
  ///
  /// Create a new partner to share assets with.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<PartnerResponseDto?> createPartnerDeprecated(String id, { Future<void>? abortTrigger, }) async {
    final response = await createPartnerDeprecatedWithHttpInfo(id, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PartnerResponseDto',) as PartnerResponseDto;
    
    }
    return null;
  }

  /// Retrieve queue counts and status
  ///
  /// Retrieve the counts of the current queue, as well as the current status.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getQueuesLegacyWithHttpInfo({ Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/jobs';

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

  /// Retrieve queue counts and status
  ///
  /// Retrieve the counts of the current queue, as well as the current status.
  Future<QueuesResponseLegacyDto?> getQueuesLegacy({ Future<void>? abortTrigger, }) async {
    final response = await getQueuesLegacyWithHttpInfo(abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'QueuesResponseLegacyDto',) as QueuesResponseLegacyDto;
    
    }
    return null;
  }

  /// Run jobs
  ///
  /// Queue all assets for a specific job type. Defaults to only queueing assets that have not yet been processed, but the force command can be used to re-process all assets.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [QueueName] name (required):
  ///
  /// * [QueueCommandDto] queueCommandDto (required):
  Future<Response> runQueueCommandLegacyWithHttpInfo(QueueName name, QueueCommandDto queueCommandDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/jobs/{name}'
      .replaceAll('{name}', name.toString());

    // ignore: prefer_final_locals
    Object? postBody = queueCommandDto;

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

  /// Run jobs
  ///
  /// Queue all assets for a specific job type. Defaults to only queueing assets that have not yet been processed, but the force command can be used to re-process all assets.
  ///
  /// Parameters:
  ///
  /// * [QueueName] name (required):
  ///
  /// * [QueueCommandDto] queueCommandDto (required):
  Future<QueueResponseLegacyDto?> runQueueCommandLegacy(QueueName name, QueueCommandDto queueCommandDto, { Future<void>? abortTrigger, }) async {
    final response = await runQueueCommandLegacyWithHttpInfo(name, queueCommandDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'QueueResponseLegacyDto',) as QueueResponseLegacyDto;
    
    }
    return null;
  }

  /// Search large assets
  ///
  /// Search for assets that are considered large based on specified criteria.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [List<String>] albumIds:
  ///   Filter by album IDs
  ///
  /// * [String] city:
  ///   Filter by city name
  ///
  /// * [String] country:
  ///   Filter by country name
  ///
  /// * [DateTime] createdAfter:
  ///   Filter by creation date (after)
  ///
  /// * [DateTime] createdBefore:
  ///   Filter by creation date (before)
  ///
  /// * [bool] isEncoded:
  ///   Filter by encoded status
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status
  ///
  /// * [bool] isMotion:
  ///   Filter by motion photo status
  ///
  /// * [bool] isNotInAlbum:
  ///   Filter assets not in any album
  ///
  /// * [bool] isOffline:
  ///   Filter by offline status
  ///
  /// * [String] lensModel:
  ///   Filter by lens model
  ///
  /// * [String] libraryId:
  ///   Library ID to filter by
  ///
  /// * [String] make:
  ///   Filter by camera make
  ///
  /// * [int] minFileSize:
  ///   Minimum file size in bytes
  ///
  /// * [String] model:
  ///   Filter by camera model
  ///
  /// * [String] ocr:
  ///   Filter by OCR text content
  ///
  /// * [List<String>] personIds:
  ///   Filter by person IDs
  ///
  /// * [int] rating:
  ///   Filter by rating [1-5], or null for unrated
  ///
  /// * [int] size:
  ///   Number of results to return
  ///
  /// * [String] state:
  ///   Filter by state/province name
  ///
  /// * [List<String>] tagIds:
  ///   Filter by tag IDs
  ///
  /// * [DateTime] takenAfter:
  ///   Filter by taken date (after)
  ///
  /// * [DateTime] takenBefore:
  ///   Filter by taken date (before)
  ///
  /// * [DateTime] trashedAfter:
  ///   Filter by trash date (after)
  ///
  /// * [DateTime] trashedBefore:
  ///   Filter by trash date (before)
  ///
  /// * [AssetTypeEnum] type:
  ///
  /// * [DateTime] updatedAfter:
  ///   Filter by update date (after)
  ///
  /// * [DateTime] updatedBefore:
  ///   Filter by update date (before)
  ///
  /// * [AssetVisibility] visibility:
  ///
  /// * [bool] withDeleted:
  ///   Include deleted assets
  ///
  /// * [bool] withExif:
  ///   Include EXIF data in response
  Future<Response> searchLargeAssetsWithHttpInfo({ List<String>? albumIds, String? city, String? country, DateTime? createdAfter, DateTime? createdBefore, bool? isEncoded, bool? isFavorite, bool? isMotion, bool? isNotInAlbum, bool? isOffline, String? lensModel, String? libraryId, String? make, int? minFileSize, String? model, String? ocr, List<String>? personIds, int? rating, int? size, String? state, List<String>? tagIds, DateTime? takenAfter, DateTime? takenBefore, DateTime? trashedAfter, DateTime? trashedBefore, AssetTypeEnum? type, DateTime? updatedAfter, DateTime? updatedBefore, AssetVisibility? visibility, bool? withDeleted, bool? withExif, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/search/large-assets';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (albumIds != null) {
      queryParams.addAll(_queryParams('multi', 'albumIds', albumIds));
    }
    if (city != null) {
      queryParams.addAll(_queryParams('', 'city', city));
    }
    if (country != null) {
      queryParams.addAll(_queryParams('', 'country', country));
    }
    if (createdAfter != null) {
      queryParams.addAll(_queryParams('', 'createdAfter', createdAfter));
    }
    if (createdBefore != null) {
      queryParams.addAll(_queryParams('', 'createdBefore', createdBefore));
    }
    if (isEncoded != null) {
      queryParams.addAll(_queryParams('', 'isEncoded', isEncoded));
    }
    if (isFavorite != null) {
      queryParams.addAll(_queryParams('', 'isFavorite', isFavorite));
    }
    if (isMotion != null) {
      queryParams.addAll(_queryParams('', 'isMotion', isMotion));
    }
    if (isNotInAlbum != null) {
      queryParams.addAll(_queryParams('', 'isNotInAlbum', isNotInAlbum));
    }
    if (isOffline != null) {
      queryParams.addAll(_queryParams('', 'isOffline', isOffline));
    }
    if (lensModel != null) {
      queryParams.addAll(_queryParams('', 'lensModel', lensModel));
    }
    if (libraryId != null) {
      queryParams.addAll(_queryParams('', 'libraryId', libraryId));
    }
    if (make != null) {
      queryParams.addAll(_queryParams('', 'make', make));
    }
    if (minFileSize != null) {
      queryParams.addAll(_queryParams('', 'minFileSize', minFileSize));
    }
    if (model != null) {
      queryParams.addAll(_queryParams('', 'model', model));
    }
    if (ocr != null) {
      queryParams.addAll(_queryParams('', 'ocr', ocr));
    }
    if (personIds != null) {
      queryParams.addAll(_queryParams('multi', 'personIds', personIds));
    }
    if (rating != null) {
      queryParams.addAll(_queryParams('', 'rating', rating));
    }
    if (size != null) {
      queryParams.addAll(_queryParams('', 'size', size));
    }
    if (state != null) {
      queryParams.addAll(_queryParams('', 'state', state));
    }
    if (tagIds != null) {
      queryParams.addAll(_queryParams('multi', 'tagIds', tagIds));
    }
    if (takenAfter != null) {
      queryParams.addAll(_queryParams('', 'takenAfter', takenAfter));
    }
    if (takenBefore != null) {
      queryParams.addAll(_queryParams('', 'takenBefore', takenBefore));
    }
    if (trashedAfter != null) {
      queryParams.addAll(_queryParams('', 'trashedAfter', trashedAfter));
    }
    if (trashedBefore != null) {
      queryParams.addAll(_queryParams('', 'trashedBefore', trashedBefore));
    }
    if (type != null) {
      queryParams.addAll(_queryParams('', 'type', type));
    }
    if (updatedAfter != null) {
      queryParams.addAll(_queryParams('', 'updatedAfter', updatedAfter));
    }
    if (updatedBefore != null) {
      queryParams.addAll(_queryParams('', 'updatedBefore', updatedBefore));
    }
    if (visibility != null) {
      queryParams.addAll(_queryParams('', 'visibility', visibility));
    }
    if (withDeleted != null) {
      queryParams.addAll(_queryParams('', 'withDeleted', withDeleted));
    }
    if (withExif != null) {
      queryParams.addAll(_queryParams('', 'withExif', withExif));
    }

    const contentTypes = <String>[];


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

  /// Search large assets
  ///
  /// Search for assets that are considered large based on specified criteria.
  ///
  /// Parameters:
  ///
  /// * [List<String>] albumIds:
  ///   Filter by album IDs
  ///
  /// * [String] city:
  ///   Filter by city name
  ///
  /// * [String] country:
  ///   Filter by country name
  ///
  /// * [DateTime] createdAfter:
  ///   Filter by creation date (after)
  ///
  /// * [DateTime] createdBefore:
  ///   Filter by creation date (before)
  ///
  /// * [bool] isEncoded:
  ///   Filter by encoded status
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status
  ///
  /// * [bool] isMotion:
  ///   Filter by motion photo status
  ///
  /// * [bool] isNotInAlbum:
  ///   Filter assets not in any album
  ///
  /// * [bool] isOffline:
  ///   Filter by offline status
  ///
  /// * [String] lensModel:
  ///   Filter by lens model
  ///
  /// * [String] libraryId:
  ///   Library ID to filter by
  ///
  /// * [String] make:
  ///   Filter by camera make
  ///
  /// * [int] minFileSize:
  ///   Minimum file size in bytes
  ///
  /// * [String] model:
  ///   Filter by camera model
  ///
  /// * [String] ocr:
  ///   Filter by OCR text content
  ///
  /// * [List<String>] personIds:
  ///   Filter by person IDs
  ///
  /// * [int] rating:
  ///   Filter by rating [1-5], or null for unrated
  ///
  /// * [int] size:
  ///   Number of results to return
  ///
  /// * [String] state:
  ///   Filter by state/province name
  ///
  /// * [List<String>] tagIds:
  ///   Filter by tag IDs
  ///
  /// * [DateTime] takenAfter:
  ///   Filter by taken date (after)
  ///
  /// * [DateTime] takenBefore:
  ///   Filter by taken date (before)
  ///
  /// * [DateTime] trashedAfter:
  ///   Filter by trash date (after)
  ///
  /// * [DateTime] trashedBefore:
  ///   Filter by trash date (before)
  ///
  /// * [AssetTypeEnum] type:
  ///
  /// * [DateTime] updatedAfter:
  ///   Filter by update date (after)
  ///
  /// * [DateTime] updatedBefore:
  ///   Filter by update date (before)
  ///
  /// * [AssetVisibility] visibility:
  ///
  /// * [bool] withDeleted:
  ///   Include deleted assets
  ///
  /// * [bool] withExif:
  ///   Include EXIF data in response
  Future<List<AssetResponseDto>?> searchLargeAssets({ List<String>? albumIds, String? city, String? country, DateTime? createdAfter, DateTime? createdBefore, bool? isEncoded, bool? isFavorite, bool? isMotion, bool? isNotInAlbum, bool? isOffline, String? lensModel, String? libraryId, String? make, int? minFileSize, String? model, String? ocr, List<String>? personIds, int? rating, int? size, String? state, List<String>? tagIds, DateTime? takenAfter, DateTime? takenBefore, DateTime? trashedAfter, DateTime? trashedBefore, AssetTypeEnum? type, DateTime? updatedAfter, DateTime? updatedBefore, AssetVisibility? visibility, bool? withDeleted, bool? withExif, Future<void>? abortTrigger, }) async {
    final response = await searchLargeAssetsWithHttpInfo(albumIds: albumIds, city: city, country: country, createdAfter: createdAfter, createdBefore: createdBefore, isEncoded: isEncoded, isFavorite: isFavorite, isMotion: isMotion, isNotInAlbum: isNotInAlbum, isOffline: isOffline, lensModel: lensModel, libraryId: libraryId, make: make, minFileSize: minFileSize, model: model, ocr: ocr, personIds: personIds, rating: rating, size: size, state: state, tagIds: tagIds, takenAfter: takenAfter, takenBefore: takenBefore, trashedAfter: trashedAfter, trashedBefore: trashedBefore, type: type, updatedAfter: updatedAfter, updatedBefore: updatedBefore, visibility: visibility, withDeleted: withDeleted, withExif: withExif, abortTrigger: abortTrigger,);
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

  /// Update an API key
  ///
  /// Updates the name and permissions of an API key by its ID. The current user must own this API key.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [ApiKeyUpdateDto] apiKeyUpdateDto (required):
  Future<Response> updateApiKeyWithHttpInfo(String id, ApiKeyUpdateDto apiKeyUpdateDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/api-keys/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = apiKeyUpdateDto;

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

  /// Update an API key
  ///
  /// Updates the name and permissions of an API key by its ID. The current user must own this API key.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [ApiKeyUpdateDto] apiKeyUpdateDto (required):
  Future<ApiKeyResponseDto?> updateApiKey(String id, ApiKeyUpdateDto apiKeyUpdateDto, { Future<void>? abortTrigger, }) async {
    final response = await updateApiKeyWithHttpInfo(id, apiKeyUpdateDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ApiKeyResponseDto',) as ApiKeyResponseDto;
    
    }
    return null;
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

  /// Update a library
  ///
  /// Update an existing external library.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateLibraryDto] updateLibraryDto (required):
  Future<Response> updateLibraryWithHttpInfo(String id, UpdateLibraryDto updateLibraryDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/libraries/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = updateLibraryDto;

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

  /// Update a library
  ///
  /// Update an existing external library.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateLibraryDto] updateLibraryDto (required):
  Future<LibraryResponseDto?> updateLibrary(String id, UpdateLibraryDto updateLibraryDto, { Future<void>? abortTrigger, }) async {
    final response = await updateLibraryWithHttpInfo(id, updateLibraryDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LibraryResponseDto',) as LibraryResponseDto;
    
    }
    return null;
  }

  /// Update a memory
  ///
  /// Update an existing memory by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [MemoryUpdateDto] memoryUpdateDto (required):
  Future<Response> updateMemoryWithHttpInfo(String id, MemoryUpdateDto memoryUpdateDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/memories/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = memoryUpdateDto;

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

  /// Update a memory
  ///
  /// Update an existing memory by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [MemoryUpdateDto] memoryUpdateDto (required):
  Future<MemoryResponseDto?> updateMemory(String id, MemoryUpdateDto memoryUpdateDto, { Future<void>? abortTrigger, }) async {
    final response = await updateMemoryWithHttpInfo(id, memoryUpdateDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'MemoryResponseDto',) as MemoryResponseDto;
    
    }
    return null;
  }

  /// Update my preferences
  ///
  /// Update the preferences of the current user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [UserPreferencesUpdateDto] userPreferencesUpdateDto (required):
  Future<Response> updateMyPreferencesWithHttpInfo(UserPreferencesUpdateDto userPreferencesUpdateDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/users/me/preferences';

    // ignore: prefer_final_locals
    Object? postBody = userPreferencesUpdateDto;

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

  /// Update my preferences
  ///
  /// Update the preferences of the current user.
  ///
  /// Parameters:
  ///
  /// * [UserPreferencesUpdateDto] userPreferencesUpdateDto (required):
  Future<UserPreferencesResponseDto?> updateMyPreferences(UserPreferencesUpdateDto userPreferencesUpdateDto, { Future<void>? abortTrigger, }) async {
    final response = await updateMyPreferencesWithHttpInfo(userPreferencesUpdateDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserPreferencesResponseDto',) as UserPreferencesResponseDto;
    
    }
    return null;
  }

  /// Update current user
  ///
  /// Update the current user making the API request.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [UserUpdateMeDto] userUpdateMeDto (required):
  Future<Response> updateMyUserWithHttpInfo(UserUpdateMeDto userUpdateMeDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/users/me';

    // ignore: prefer_final_locals
    Object? postBody = userUpdateMeDto;

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

  /// Update current user
  ///
  /// Update the current user making the API request.
  ///
  /// Parameters:
  ///
  /// * [UserUpdateMeDto] userUpdateMeDto (required):
  Future<UserAdminResponseDto?> updateMyUser(UserUpdateMeDto userUpdateMeDto, { Future<void>? abortTrigger, }) async {
    final response = await updateMyUserWithHttpInfo(userUpdateMeDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserAdminResponseDto',) as UserAdminResponseDto;
    
    }
    return null;
  }

  /// Update person
  ///
  /// Update an individual person.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [PersonUpdateDto] personUpdateDto (required):
  Future<Response> updatePersonWithHttpInfo(String id, PersonUpdateDto personUpdateDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/people/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = personUpdateDto;

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

  /// Update person
  ///
  /// Update an individual person.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [PersonUpdateDto] personUpdateDto (required):
  Future<PersonResponseDto?> updatePerson(String id, PersonUpdateDto personUpdateDto, { Future<void>? abortTrigger, }) async {
    final response = await updatePersonWithHttpInfo(id, personUpdateDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PersonResponseDto',) as PersonResponseDto;
    
    }
    return null;
  }

  /// Update a session
  ///
  /// Update a specific session identified by id.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SessionUpdateDto] sessionUpdateDto (required):
  Future<Response> updateSessionWithHttpInfo(String id, SessionUpdateDto sessionUpdateDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sessions/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = sessionUpdateDto;

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

  /// Update a session
  ///
  /// Update a specific session identified by id.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SessionUpdateDto] sessionUpdateDto (required):
  Future<SessionResponseDto?> updateSession(String id, SessionUpdateDto sessionUpdateDto, { Future<void>? abortTrigger, }) async {
    final response = await updateSessionWithHttpInfo(id, sessionUpdateDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SessionResponseDto',) as SessionResponseDto;
    
    }
    return null;
  }

  /// Update a stack
  ///
  /// Update an existing stack by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [StackUpdateDto] stackUpdateDto (required):
  Future<Response> updateStackWithHttpInfo(String id, StackUpdateDto stackUpdateDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/stacks/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = stackUpdateDto;

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

  /// Update a stack
  ///
  /// Update an existing stack by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [StackUpdateDto] stackUpdateDto (required):
  Future<StackResponseDto?> updateStack(String id, StackUpdateDto stackUpdateDto, { Future<void>? abortTrigger, }) async {
    final response = await updateStackWithHttpInfo(id, stackUpdateDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'StackResponseDto',) as StackResponseDto;
    
    }
    return null;
  }

  /// Update a tag
  ///
  /// Update an existing tag identified by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [TagUpdateDto] tagUpdateDto (required):
  Future<Response> updateTagWithHttpInfo(String id, TagUpdateDto tagUpdateDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/tags/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = tagUpdateDto;

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

  /// Update a tag
  ///
  /// Update an existing tag identified by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [TagUpdateDto] tagUpdateDto (required):
  Future<TagResponseDto?> updateTag(String id, TagUpdateDto tagUpdateDto, { Future<void>? abortTrigger, }) async {
    final response = await updateTagWithHttpInfo(id, tagUpdateDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'TagResponseDto',) as TagResponseDto;
    
    }
    return null;
  }

  /// Update a user
  ///
  /// Update an existing user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UserAdminUpdateDto] userAdminUpdateDto (required):
  Future<Response> updateUserAdminWithHttpInfo(String id, UserAdminUpdateDto userAdminUpdateDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/users/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = userAdminUpdateDto;

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

  /// Update a user
  ///
  /// Update an existing user.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UserAdminUpdateDto] userAdminUpdateDto (required):
  Future<UserAdminResponseDto?> updateUserAdmin(String id, UserAdminUpdateDto userAdminUpdateDto, { Future<void>? abortTrigger, }) async {
    final response = await updateUserAdminWithHttpInfo(id, userAdminUpdateDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserAdminResponseDto',) as UserAdminResponseDto;
    
    }
    return null;
  }

  /// Update user preferences
  ///
  /// Update the preferences of a specific user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UserPreferencesUpdateDto] userPreferencesUpdateDto (required):
  Future<Response> updateUserPreferencesAdminWithHttpInfo(String id, UserPreferencesUpdateDto userPreferencesUpdateDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/users/{id}/preferences'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = userPreferencesUpdateDto;

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

  /// Update user preferences
  ///
  /// Update the preferences of a specific user.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UserPreferencesUpdateDto] userPreferencesUpdateDto (required):
  Future<UserPreferencesResponseDto?> updateUserPreferencesAdmin(String id, UserPreferencesUpdateDto userPreferencesUpdateDto, { Future<void>? abortTrigger, }) async {
    final response = await updateUserPreferencesAdminWithHttpInfo(id, userPreferencesUpdateDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserPreferencesResponseDto',) as UserPreferencesResponseDto;
    
    }
    return null;
  }

  /// Update a workflow
  ///
  /// Update the information of a specific workflow by its ID. This endpoint can be used to update the workflow name, description, trigger type, filters and actions order, etc.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [WorkflowUpdateDto] workflowUpdateDto (required):
  Future<Response> updateWorkflowWithHttpInfo(String id, WorkflowUpdateDto workflowUpdateDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/workflows/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = workflowUpdateDto;

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

  /// Update a workflow
  ///
  /// Update the information of a specific workflow by its ID. This endpoint can be used to update the workflow name, description, trigger type, filters and actions order, etc.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [WorkflowUpdateDto] workflowUpdateDto (required):
  Future<WorkflowResponseDto?> updateWorkflow(String id, WorkflowUpdateDto workflowUpdateDto, { Future<void>? abortTrigger, }) async {
    final response = await updateWorkflowWithHttpInfo(id, workflowUpdateDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'WorkflowResponseDto',) as WorkflowResponseDto;
    
    }
    return null;
  }
}
