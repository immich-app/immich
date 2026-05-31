// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class TrashApi {
  TrashApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion emptyTrashAddedIn = .new(1, 0, 0);

  static const ApiState emptyTrashState = .stable;

  static const ApiVersion restoreTrashAddedIn = .new(1, 0, 0);

  static const ApiState restoreTrashState = .stable;

  static const ApiVersion restoreAssetsAddedIn = .new(1, 0, 0);

  static const ApiState restoreAssetsState = .stable;

  /// Empty trash
  ///
  /// Permanently delete all items in the trash.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> emptyTrashWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/trash/empty';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

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

  /// Empty trash
  ///
  /// Permanently delete all items in the trash.
  ///
  /// Available since server v1.0.0.
  Future<TrashResponseDto> emptyTrash({Future<void>? abortTrigger}) async {
    final response = await emptyTrashWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'TrashResponseDto')
          as TrashResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Restore trash
  ///
  /// Restore all items in the trash.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> restoreTrashWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/trash/restore';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

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

  /// Restore trash
  ///
  /// Restore all items in the trash.
  ///
  /// Available since server v1.0.0.
  Future<TrashResponseDto> restoreTrash({Future<void>? abortTrigger}) async {
    final response = await restoreTrashWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'TrashResponseDto')
          as TrashResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Restore assets
  ///
  /// Restore specific assets from the trash.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> restoreAssetsWithHttpInfo(BulkIdsDto bulkIdsDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/trash/restore/assets';

    Object? postBody = bulkIdsDto;

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

  /// Restore assets
  ///
  /// Restore specific assets from the trash.
  ///
  /// Available since server v1.0.0.
  Future<TrashResponseDto> restoreAssets(BulkIdsDto bulkIdsDto, {Future<void>? abortTrigger}) async {
    final response = await restoreAssetsWithHttpInfo(bulkIdsDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'TrashResponseDto')
          as TrashResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
