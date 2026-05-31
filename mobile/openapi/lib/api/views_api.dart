// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class ViewsApi {
  ViewsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getAssetsByOriginalPathAddedIn = .new(1, 0, 0);

  static const ApiState getAssetsByOriginalPathState = .stable;

  static const ApiVersion getUniqueOriginalPathsAddedIn = .new(1, 0, 0);

  static const ApiState getUniqueOriginalPathsState = .stable;

  /// Retrieve assets by original path
  ///
  /// Retrieve assets that are children of a specific folder.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAssetsByOriginalPathWithHttpInfo({required String path, Future<void>? abortTrigger}) async {
    final apiPath = r'/view/folder';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    queryParams.addAll(_queryParams('', 'path', path));

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

  /// Retrieve assets by original path
  ///
  /// Retrieve assets that are children of a specific folder.
  ///
  /// Available since server v1.0.0.
  Future<List<AssetResponseDto>> getAssetsByOriginalPath({required String path, Future<void>? abortTrigger}) async {
    final response = await getAssetsByOriginalPathWithHttpInfo(path: path, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<AssetResponseDto>') as List)
          .cast<AssetResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve unique paths
  ///
  /// Retrieve a list of unique folder paths from asset original paths.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getUniqueOriginalPathsWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/view/folder/unique-paths';

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

  /// Retrieve unique paths
  ///
  /// Retrieve a list of unique folder paths from asset original paths.
  ///
  /// Available since server v1.0.0.
  Future<List<String>> getUniqueOriginalPaths({Future<void>? abortTrigger}) async {
    final response = await getUniqueOriginalPathsWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<String>') as List).cast<String>().toList(
        growable: false,
      );
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
