// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class MemoriesApi {
  MemoriesApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion searchMemoriesAddedIn = .new(1, 0, 0);

  static const ApiState searchMemoriesState = .stable;

  static const ApiVersion createMemoryAddedIn = .new(1, 0, 0);

  static const ApiState createMemoryState = .stable;

  static const ApiVersion memoriesStatisticsAddedIn = .new(1, 0, 0);

  static const ApiState memoriesStatisticsState = .stable;

  static const ApiVersion deleteMemoryAddedIn = .new(1, 0, 0);

  static const ApiState deleteMemoryState = .stable;

  static const ApiVersion getMemoryAddedIn = .new(1, 0, 0);

  static const ApiState getMemoryState = .stable;

  static const ApiVersion updateMemoryAddedIn = .new(1, 0, 0);

  static const ApiState updateMemoryState = .stable;

  static const ApiVersion removeMemoryAssetsAddedIn = .new(1, 0, 0);

  static const ApiState removeMemoryAssetsState = .stable;

  static const ApiVersion addMemoryAssetsAddedIn = .new(1, 0, 0);

  static const ApiState addMemoryAssetsState = .stable;

  /// Retrieve memories
  ///
  /// Retrieve a list of memories. Memories are sorted descending by creation date by default, although they can also be sorted in ascending order, or randomly.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchMemoriesWithHttpInfo({
    DateTime? for$,
    bool? isSaved,
    bool? isTrashed,
    MemorySearchOrder? order,
    int? size,
    MemoryType? type,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/memories';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (for$ != null) {
      queryParams.addAll(_queryParams('', 'for', for$));
    }
    if (isSaved != null) {
      queryParams.addAll(_queryParams('', 'isSaved', isSaved));
    }
    if (isTrashed != null) {
      queryParams.addAll(_queryParams('', 'isTrashed', isTrashed));
    }
    if (order != null) {
      queryParams.addAll(_queryParams('', 'order', order));
    }
    if (size != null) {
      queryParams.addAll(_queryParams('', 'size', size));
    }
    if (type != null) {
      queryParams.addAll(_queryParams('', 'type', type));
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

  /// Retrieve memories
  ///
  /// Retrieve a list of memories. Memories are sorted descending by creation date by default, although they can also be sorted in ascending order, or randomly.
  ///
  /// Available since server v1.0.0.
  Future<List<MemoryResponseDto>> searchMemories({
    DateTime? for$,
    bool? isSaved,
    bool? isTrashed,
    MemorySearchOrder? order,
    int? size,
    MemoryType? type,
    Future<void>? abortTrigger,
  }) async {
    final response = await searchMemoriesWithHttpInfo(
      for$: for$,
      isSaved: isSaved,
      isTrashed: isTrashed,
      order: order,
      size: size,
      type: type,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<MemoryResponseDto>') as List)
          .cast<MemoryResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create a memory
  ///
  /// Create a new memory by providing a name, description, and a list of asset IDs to include in the memory.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createMemoryWithHttpInfo(MemoryCreateDto memoryCreateDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/memories';

    Object? postBody = memoryCreateDto;

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

  /// Create a memory
  ///
  /// Create a new memory by providing a name, description, and a list of asset IDs to include in the memory.
  ///
  /// Available since server v1.0.0.
  Future<MemoryResponseDto> createMemory(MemoryCreateDto memoryCreateDto, {Future<void>? abortTrigger}) async {
    final response = await createMemoryWithHttpInfo(memoryCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'MemoryResponseDto')
          as MemoryResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve memories statistics
  ///
  /// Retrieve statistics about memories, such as total count and other relevant metrics.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> memoriesStatisticsWithHttpInfo({
    DateTime? for$,
    bool? isSaved,
    bool? isTrashed,
    MemorySearchOrder? order,
    int? size,
    MemoryType? type,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/memories/statistics';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (for$ != null) {
      queryParams.addAll(_queryParams('', 'for', for$));
    }
    if (isSaved != null) {
      queryParams.addAll(_queryParams('', 'isSaved', isSaved));
    }
    if (isTrashed != null) {
      queryParams.addAll(_queryParams('', 'isTrashed', isTrashed));
    }
    if (order != null) {
      queryParams.addAll(_queryParams('', 'order', order));
    }
    if (size != null) {
      queryParams.addAll(_queryParams('', 'size', size));
    }
    if (type != null) {
      queryParams.addAll(_queryParams('', 'type', type));
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

  /// Retrieve memories statistics
  ///
  /// Retrieve statistics about memories, such as total count and other relevant metrics.
  ///
  /// Available since server v1.0.0.
  Future<MemoryStatisticsResponseDto> memoriesStatistics({
    DateTime? for$,
    bool? isSaved,
    bool? isTrashed,
    MemorySearchOrder? order,
    int? size,
    MemoryType? type,
    Future<void>? abortTrigger,
  }) async {
    final response = await memoriesStatisticsWithHttpInfo(
      for$: for$,
      isSaved: isSaved,
      isTrashed: isTrashed,
      order: order,
      size: size,
      type: type,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'MemoryStatisticsResponseDto')
          as MemoryStatisticsResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete a memory
  ///
  /// Delete a specific memory by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteMemoryWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/memories/{id}'.replaceAll('{id}', id);

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

  /// Delete a memory
  ///
  /// Delete a specific memory by its ID.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteMemory(String id, {Future<void>? abortTrigger}) async {
    final response = await deleteMemoryWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve a memory
  ///
  /// Retrieve a specific memory by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getMemoryWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/memories/{id}'.replaceAll('{id}', id);

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

  /// Retrieve a memory
  ///
  /// Retrieve a specific memory by its ID.
  ///
  /// Available since server v1.0.0.
  Future<MemoryResponseDto> getMemory(String id, {Future<void>? abortTrigger}) async {
    final response = await getMemoryWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'MemoryResponseDto')
          as MemoryResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update a memory
  ///
  /// Update an existing memory by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateMemoryWithHttpInfo(
    String id,
    MemoryUpdateDto memoryUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/memories/{id}'.replaceAll('{id}', id);

    Object? postBody = memoryUpdateDto;

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

  /// Update a memory
  ///
  /// Update an existing memory by its ID.
  ///
  /// Available since server v1.0.0.
  Future<MemoryResponseDto> updateMemory(
    String id,
    MemoryUpdateDto memoryUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateMemoryWithHttpInfo(id, memoryUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'MemoryResponseDto')
          as MemoryResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Remove assets from a memory
  ///
  /// Remove a list of asset IDs from a specific memory.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> removeMemoryAssetsWithHttpInfo(
    String id,
    BulkIdsDto bulkIdsDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/memories/{id}/assets'.replaceAll('{id}', id);

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

  /// Remove assets from a memory
  ///
  /// Remove a list of asset IDs from a specific memory.
  ///
  /// Available since server v1.0.0.
  Future<List<BulkIdResponseDto>> removeMemoryAssets(
    String id,
    BulkIdsDto bulkIdsDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await removeMemoryAssetsWithHttpInfo(id, bulkIdsDto, abortTrigger: abortTrigger);
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

  /// Add assets to a memory
  ///
  /// Add a list of asset IDs to a specific memory.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> addMemoryAssetsWithHttpInfo(String id, BulkIdsDto bulkIdsDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/memories/{id}/assets'.replaceAll('{id}', id);

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

  /// Add assets to a memory
  ///
  /// Add a list of asset IDs to a specific memory.
  ///
  /// Available since server v1.0.0.
  Future<List<BulkIdResponseDto>> addMemoryAssets(
    String id,
    BulkIdsDto bulkIdsDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await addMemoryAssetsWithHttpInfo(id, bulkIdsDto, abortTrigger: abortTrigger);
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
}
