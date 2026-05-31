// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class DuplicatesApi {
  DuplicatesApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion deleteDuplicatesAddedIn = .new(1, 0, 0);

  static const ApiState deleteDuplicatesState = .stable;

  static const ApiVersion getAssetDuplicatesAddedIn = .new(1, 0, 0);

  static const ApiState getAssetDuplicatesState = .stable;

  static const ApiVersion resolveDuplicatesAddedIn = .new(3, 0, 0);

  static const ApiState resolveDuplicatesState = .alpha;

  static const ApiVersion deleteDuplicateAddedIn = .new(1, 0, 0);

  static const ApiState deleteDuplicateState = .stable;

  /// Delete duplicates
  ///
  /// Delete multiple duplicate assets specified by their IDs.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteDuplicatesWithHttpInfo(BulkIdsDto bulkIdsDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/duplicates';

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

  /// Delete duplicates
  ///
  /// Delete multiple duplicate assets specified by their IDs.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteDuplicates(BulkIdsDto bulkIdsDto, {Future<void>? abortTrigger}) async {
    final response = await deleteDuplicatesWithHttpInfo(bulkIdsDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve duplicates
  ///
  /// Retrieve a list of duplicate assets available to the authenticated user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAssetDuplicatesWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/duplicates';

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

  /// Retrieve duplicates
  ///
  /// Retrieve a list of duplicate assets available to the authenticated user.
  ///
  /// Available since server v1.0.0.
  Future<List<DuplicateResponseDto>> getAssetDuplicates({Future<void>? abortTrigger}) async {
    final response = await getAssetDuplicatesWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<DuplicateResponseDto>') as List)
          .cast<DuplicateResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Resolve duplicate groups
  ///
  /// Resolve duplicate groups by synchronizing metadata across assets and deleting/trashing duplicates.
  ///
  /// Available since server v3.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> resolveDuplicatesWithHttpInfo(
    DuplicateResolveDto duplicateResolveDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/duplicates/resolve';

    Object? postBody = duplicateResolveDto;

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

  /// Resolve duplicate groups
  ///
  /// Resolve duplicate groups by synchronizing metadata across assets and deleting/trashing duplicates.
  ///
  /// Available since server v3.0.0.
  Future<List<BulkIdResponseDto>> resolveDuplicates(
    DuplicateResolveDto duplicateResolveDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await resolveDuplicatesWithHttpInfo(duplicateResolveDto, abortTrigger: abortTrigger);
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

  /// Dismiss a duplicate group
  ///
  /// Dismiss a duplicate group by its ID, unlinking all assets in the group without deleting them.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteDuplicateWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/duplicates/{id}'.replaceAll('{id}', id);

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

  /// Dismiss a duplicate group
  ///
  /// Dismiss a duplicate group by its ID, unlinking all assets in the group without deleting them.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteDuplicate(String id, {Future<void>? abortTrigger}) async {
    final response = await deleteDuplicateWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
