//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class DownloadApi {
  DownloadApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Download asset archive
  ///
  /// Download a ZIP archive containing the specified assets. The assets must have been previously requested via the \"getDownloadInfo\" endpoint.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [AssetIdsDto] assetIdsDto (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> downloadArchiveWithHttpInfo(AssetIdsDto assetIdsDto, { String? key, String? slug, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/download/archive';

    // ignore: prefer_final_locals
    Object? postBody = assetIdsDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
    }

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

  /// Download asset archive
  ///
  /// Download a ZIP archive containing the specified assets. The assets must have been previously requested via the \"getDownloadInfo\" endpoint.
  ///
  /// Parameters:
  ///
  /// * [AssetIdsDto] assetIdsDto (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<MultipartFile?> downloadArchive(AssetIdsDto assetIdsDto, { String? key, String? slug, }) async {
    final response = await downloadArchiveWithHttpInfo(assetIdsDto,  key: key, slug: slug, );
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

  /// Retrieve download information
  ///
  /// Retrieve information about how to request a download for the specified assets or album. The response includes groups of assets that can be downloaded together.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [DownloadInfoDto] downloadInfoDto (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> getDownloadInfoWithHttpInfo(DownloadInfoDto downloadInfoDto, { String? key, String? slug, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/download/info';

    // ignore: prefer_final_locals
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

  /// Retrieve download information
  ///
  /// Retrieve information about how to request a download for the specified assets or album. The response includes groups of assets that can be downloaded together.
  ///
  /// Parameters:
  ///
  /// * [DownloadInfoDto] downloadInfoDto (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<DownloadResponseDto?> getDownloadInfo(DownloadInfoDto downloadInfoDto, { String? key, String? slug, }) async {
    final response = await getDownloadInfoWithHttpInfo(downloadInfoDto,  key: key, slug: slug, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'DownloadResponseDto',) as DownloadResponseDto;
    
    }
    return null;
  }
}
