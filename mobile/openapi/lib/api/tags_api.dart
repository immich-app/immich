// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class TagsApi {
  TagsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getAllTagsAddedIn = .new(1, 0, 0);

  static const ApiState getAllTagsState = .stable;

  static const ApiVersion createTagAddedIn = .new(1, 0, 0);

  static const ApiState createTagState = .stable;

  static const ApiVersion upsertTagsAddedIn = .new(1, 0, 0);

  static const ApiState upsertTagsState = .stable;

  static const ApiVersion bulkTagAssetsAddedIn = .new(1, 0, 0);

  static const ApiState bulkTagAssetsState = .stable;

  static const ApiVersion deleteTagAddedIn = .new(1, 0, 0);

  static const ApiState deleteTagState = .stable;

  static const ApiVersion getTagByIdAddedIn = .new(1, 0, 0);

  static const ApiState getTagByIdState = .stable;

  static const ApiVersion updateTagAddedIn = .new(1, 0, 0);

  static const ApiState updateTagState = .stable;

  static const ApiVersion untagAssetsAddedIn = .new(1, 0, 0);

  static const ApiState untagAssetsState = .stable;

  static const ApiVersion tagAssetsAddedIn = .new(1, 0, 0);

  static const ApiState tagAssetsState = .stable;

  /// Retrieve tags
  ///
  /// Retrieve a list of all tags.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAllTagsWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/tags';

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

  /// Retrieve tags
  ///
  /// Retrieve a list of all tags.
  ///
  /// Available since server v1.0.0.
  Future<List<TagResponseDto>> getAllTags({Future<void>? abortTrigger}) async {
    final response = await getAllTagsWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<TagResponseDto>') as List)
          .cast<TagResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create a tag
  ///
  /// Create a new tag by providing a name and optional color.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createTagWithHttpInfo(TagCreateDto tagCreateDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/tags';

    Object? postBody = tagCreateDto;

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

  /// Create a tag
  ///
  /// Create a new tag by providing a name and optional color.
  ///
  /// Available since server v1.0.0.
  Future<TagResponseDto> createTag(TagCreateDto tagCreateDto, {Future<void>? abortTrigger}) async {
    final response = await createTagWithHttpInfo(tagCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'TagResponseDto') as TagResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Upsert tags
  ///
  /// Create or update multiple tags in a single request.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> upsertTagsWithHttpInfo(TagUpsertDto tagUpsertDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/tags';

    Object? postBody = tagUpsertDto;

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

  /// Upsert tags
  ///
  /// Create or update multiple tags in a single request.
  ///
  /// Available since server v1.0.0.
  Future<List<TagResponseDto>> upsertTags(TagUpsertDto tagUpsertDto, {Future<void>? abortTrigger}) async {
    final response = await upsertTagsWithHttpInfo(tagUpsertDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<TagResponseDto>') as List)
          .cast<TagResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Tag assets
  ///
  /// Add multiple tags to multiple assets in a single request.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> bulkTagAssetsWithHttpInfo(TagBulkAssetsDto tagBulkAssetsDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/tags/assets';

    Object? postBody = tagBulkAssetsDto;

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

  /// Tag assets
  ///
  /// Add multiple tags to multiple assets in a single request.
  ///
  /// Available since server v1.0.0.
  Future<TagBulkAssetsResponseDto> bulkTagAssets(
    TagBulkAssetsDto tagBulkAssetsDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await bulkTagAssetsWithHttpInfo(tagBulkAssetsDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'TagBulkAssetsResponseDto')
          as TagBulkAssetsResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete a tag
  ///
  /// Delete a specific tag by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteTagWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/tags/{id}'.replaceAll('{id}', id);

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

  /// Delete a tag
  ///
  /// Delete a specific tag by its ID.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteTag(String id, {Future<void>? abortTrigger}) async {
    final response = await deleteTagWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve a tag
  ///
  /// Retrieve a specific tag by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getTagByIdWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/tags/{id}'.replaceAll('{id}', id);

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

  /// Retrieve a tag
  ///
  /// Retrieve a specific tag by its ID.
  ///
  /// Available since server v1.0.0.
  Future<TagResponseDto> getTagById(String id, {Future<void>? abortTrigger}) async {
    final response = await getTagByIdWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'TagResponseDto') as TagResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update a tag
  ///
  /// Update an existing tag identified by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateTagWithHttpInfo(String id, TagUpdateDto tagUpdateDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/tags/{id}'.replaceAll('{id}', id);

    Object? postBody = tagUpdateDto;

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

  /// Update a tag
  ///
  /// Update an existing tag identified by its ID.
  ///
  /// Available since server v1.0.0.
  Future<TagResponseDto> updateTag(String id, TagUpdateDto tagUpdateDto, {Future<void>? abortTrigger}) async {
    final response = await updateTagWithHttpInfo(id, tagUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'TagResponseDto') as TagResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Untag assets
  ///
  /// Remove a tag from all the specified assets.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> untagAssetsWithHttpInfo(String id, BulkIdsDto bulkIdsDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/tags/{id}/assets'.replaceAll('{id}', id);

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

  /// Untag assets
  ///
  /// Remove a tag from all the specified assets.
  ///
  /// Available since server v1.0.0.
  Future<List<BulkIdResponseDto>> untagAssets(String id, BulkIdsDto bulkIdsDto, {Future<void>? abortTrigger}) async {
    final response = await untagAssetsWithHttpInfo(id, bulkIdsDto, abortTrigger: abortTrigger);
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

  /// Tag assets
  ///
  /// Add a tag to all the specified assets.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> tagAssetsWithHttpInfo(String id, BulkIdsDto bulkIdsDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/tags/{id}/assets'.replaceAll('{id}', id);

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

  /// Tag assets
  ///
  /// Add a tag to all the specified assets.
  ///
  /// Available since server v1.0.0.
  Future<List<BulkIdResponseDto>> tagAssets(String id, BulkIdsDto bulkIdsDto, {Future<void>? abortTrigger}) async {
    final response = await tagAssetsWithHttpInfo(id, bulkIdsDto, abortTrigger: abortTrigger);
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
