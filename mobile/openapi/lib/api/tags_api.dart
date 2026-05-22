//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class TagsApi {
  TagsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Tag assets
  ///
  /// Add multiple tags to multiple assets in a single request.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [TagBulkAssetsDto] tagBulkAssetsDto (required):
  Future<Response> bulkTagAssetsWithHttpInfo(TagBulkAssetsDto tagBulkAssetsDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/tags/assets';

    // ignore: prefer_final_locals
    Object? postBody = tagBulkAssetsDto;

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

  /// Tag assets
  ///
  /// Add multiple tags to multiple assets in a single request.
  ///
  /// Parameters:
  ///
  /// * [TagBulkAssetsDto] tagBulkAssetsDto (required):
  Future<TagBulkAssetsResponseDto?> bulkTagAssets(TagBulkAssetsDto tagBulkAssetsDto,) async {
    final response = await bulkTagAssetsWithHttpInfo(tagBulkAssetsDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'TagBulkAssetsResponseDto',) as TagBulkAssetsResponseDto;
    
    }
    return null;
  }

  /// Create a tag
  ///
  /// Create a new tag by providing a name and optional color.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [TagCreateDto] tagCreateDto (required):
  Future<Response> createTagWithHttpInfo(TagCreateDto tagCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/tags';

    // ignore: prefer_final_locals
    Object? postBody = tagCreateDto;

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

  /// Create a tag
  ///
  /// Create a new tag by providing a name and optional color.
  ///
  /// Parameters:
  ///
  /// * [TagCreateDto] tagCreateDto (required):
  Future<TagResponseDto?> createTag(TagCreateDto tagCreateDto,) async {
    final response = await createTagWithHttpInfo(tagCreateDto,);
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

  /// Delete a tag
  ///
  /// Delete a specific tag by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteTagWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/tags/{id}'
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
    );
  }

  /// Delete a tag
  ///
  /// Delete a specific tag by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteTag(String id,) async {
    final response = await deleteTagWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve tags
  ///
  /// Retrieve a list of all tags.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAllTagsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/tags';

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

  /// Retrieve tags
  ///
  /// Retrieve a list of all tags.
  Future<List<TagResponseDto>?> getAllTags() async {
    final response = await getAllTagsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<TagResponseDto>') as List)
        .cast<TagResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Retrieve a tag
  ///
  /// Retrieve a specific tag by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getTagByIdWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/tags/{id}'
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

  /// Retrieve a tag
  ///
  /// Retrieve a specific tag by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<TagResponseDto?> getTagById(String id,) async {
    final response = await getTagByIdWithHttpInfo(id,);
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

  /// Tag assets
  ///
  /// Add a tag to all the specified assets.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  Future<Response> tagAssetsWithHttpInfo(String id, BulkIdsDto bulkIdsDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/tags/{id}/assets'
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
    );
  }

  /// Tag assets
  ///
  /// Add a tag to all the specified assets.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  Future<List<BulkIdResponseDto>?> tagAssets(String id, BulkIdsDto bulkIdsDto,) async {
    final response = await tagAssetsWithHttpInfo(id, bulkIdsDto,);
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

  /// Untag assets
  ///
  /// Remove a tag from all the specified assets.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  Future<Response> untagAssetsWithHttpInfo(String id, BulkIdsDto bulkIdsDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/tags/{id}/assets'
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
    );
  }

  /// Untag assets
  ///
  /// Remove a tag from all the specified assets.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  Future<List<BulkIdResponseDto>?> untagAssets(String id, BulkIdsDto bulkIdsDto,) async {
    final response = await untagAssetsWithHttpInfo(id, bulkIdsDto,);
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
  Future<Response> updateTagWithHttpInfo(String id, TagUpdateDto tagUpdateDto,) async {
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
  Future<TagResponseDto?> updateTag(String id, TagUpdateDto tagUpdateDto,) async {
    final response = await updateTagWithHttpInfo(id, tagUpdateDto,);
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

  /// Upsert tags
  ///
  /// Create or update multiple tags in a single request.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [TagUpsertDto] tagUpsertDto (required):
  Future<Response> upsertTagsWithHttpInfo(TagUpsertDto tagUpsertDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/tags';

    // ignore: prefer_final_locals
    Object? postBody = tagUpsertDto;

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

  /// Upsert tags
  ///
  /// Create or update multiple tags in a single request.
  ///
  /// Parameters:
  ///
  /// * [TagUpsertDto] tagUpsertDto (required):
  Future<List<TagResponseDto>?> upsertTags(TagUpsertDto tagUpsertDto,) async {
    final response = await upsertTagsWithHttpInfo(tagUpsertDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<TagResponseDto>') as List)
        .cast<TagResponseDto>()
        .toList(growable: false);

    }
    return null;
  }
}
