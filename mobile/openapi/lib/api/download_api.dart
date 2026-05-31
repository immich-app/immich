// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class DownloadApi {
  DownloadApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion downloadArchiveAddedIn = .new(1, 0, 0);

  static const ApiState downloadArchiveState = .stable;

  static const ApiVersion getDownloadInfoAddedIn = .new(1, 0, 0);

  static const ApiState getDownloadInfoState = .stable;

  /// Download asset archive
  ///
  /// Download a ZIP archive containing the specified assets. The assets must have been previously requested via the "getDownloadInfo" endpoint.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> downloadArchiveWithHttpInfo(
    DownloadArchiveDto downloadArchiveDto, {
    String? key,
    String? slug,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/download/archive';

    Object? postBody = downloadArchiveDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
    }

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

  /// Download asset archive
  ///
  /// Download a ZIP archive containing the specified assets. The assets must have been previously requested via the "getDownloadInfo" endpoint.
  ///
  /// Available since server v1.0.0.
  Future<Uint8List> downloadArchive(
    DownloadArchiveDto downloadArchiveDto, {
    String? key,
    String? slug,
    Future<void>? abortTrigger,
  }) async {
    final response = await downloadArchiveWithHttpInfo(
      downloadArchiveDto,
      key: key,
      slug: slug,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    return response.bodyBytes;
  }

  /// Retrieve download information
  ///
  /// Retrieve information about how to request a download for the specified assets or album. The response includes groups of assets that can be downloaded together.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getDownloadInfoWithHttpInfo(
    DownloadInfoDto downloadInfoDto, {
    String? key,
    String? slug,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/download/info';

    Object? postBody = downloadInfoDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
    }

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

  /// Retrieve download information
  ///
  /// Retrieve information about how to request a download for the specified assets or album. The response includes groups of assets that can be downloaded together.
  ///
  /// Available since server v1.0.0.
  Future<DownloadResponseDto> getDownloadInfo(
    DownloadInfoDto downloadInfoDto, {
    String? key,
    String? slug,
    Future<void>? abortTrigger,
  }) async {
    final response = await getDownloadInfoWithHttpInfo(
      downloadInfoDto,
      key: key,
      slug: slug,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'DownloadResponseDto')
          as DownloadResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
