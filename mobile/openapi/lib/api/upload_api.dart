//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class UploadApi {
  UploadApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// This endpoint requires the `asset.upload` permission.
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
  Future<Response> cancelUploadWithHttpInfo(String id, { String? key, String? slug, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/upload/{id}'
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
      'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// This endpoint requires the `asset.upload` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<void> cancelUpload(String id, { String? key, String? slug, }) async {
    final response = await cancelUploadWithHttpInfo(id,  key: key, slug: slug, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// This endpoint requires the `asset.upload` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> getUploadOptionsWithHttpInfo({ String? key, String? slug, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/upload';

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
      'OPTIONS',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// This endpoint requires the `asset.upload` permission.
  ///
  /// Parameters:
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<void> getUploadOptions({ String? key, String? slug, }) async {
    final response = await getUploadOptionsWithHttpInfo( key: key, slug: slug, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// This endpoint requires the `asset.upload` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] draftUploadInteropVersion (required):
  ///   Indicates the version of the RUFH protocol supported by the client.
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> getUploadStatusWithHttpInfo(String draftUploadInteropVersion, String id, { String? key, String? slug, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/upload/{id}'
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

    headerParams[r'draft-upload-interop-version'] = parameterToString(draftUploadInteropVersion);

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'HEAD',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// This endpoint requires the `asset.upload` permission.
  ///
  /// Parameters:
  ///
  /// * [String] draftUploadInteropVersion (required):
  ///   Indicates the version of the RUFH protocol supported by the client.
  ///
  /// * [String] id (required):
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<void> getUploadStatus(String draftUploadInteropVersion, String id, { String? key, String? slug, }) async {
    final response = await getUploadStatusWithHttpInfo(draftUploadInteropVersion, id,  key: key, slug: slug, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// This endpoint requires the `asset.upload` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] contentLength (required):
  ///   Non-negative size of the request body in bytes.
  ///
  /// * [String] draftUploadInteropVersion (required):
  ///   Indicates the version of the RUFH protocol supported by the client.
  ///
  /// * [String] id (required):
  ///
  /// * [String] uploadComplete (required):
  ///   Structured boolean indicating whether this request completes the file. Use Upload-Incomplete instead for version <= 3.
  ///
  /// * [String] uploadOffset (required):
  ///   Non-negative byte offset indicating the starting position of the data in the request body within the entire file.
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> resumeUploadWithHttpInfo(String contentLength, String draftUploadInteropVersion, String id, String uploadComplete, String uploadOffset, { String? key, String? slug, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/upload/{id}'
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

    headerParams[r'content-length'] = parameterToString(contentLength);
    headerParams[r'draft-upload-interop-version'] = parameterToString(draftUploadInteropVersion);
    headerParams[r'upload-complete'] = parameterToString(uploadComplete);
    headerParams[r'upload-offset'] = parameterToString(uploadOffset);

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      apiPath,
      'PATCH',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// This endpoint requires the `asset.upload` permission.
  ///
  /// Parameters:
  ///
  /// * [String] contentLength (required):
  ///   Non-negative size of the request body in bytes.
  ///
  /// * [String] draftUploadInteropVersion (required):
  ///   Indicates the version of the RUFH protocol supported by the client.
  ///
  /// * [String] id (required):
  ///
  /// * [String] uploadComplete (required):
  ///   Structured boolean indicating whether this request completes the file. Use Upload-Incomplete instead for version <= 3.
  ///
  /// * [String] uploadOffset (required):
  ///   Non-negative byte offset indicating the starting position of the data in the request body within the entire file.
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<void> resumeUpload(String contentLength, String draftUploadInteropVersion, String id, String uploadComplete, String uploadOffset, { String? key, String? slug, }) async {
    final response = await resumeUploadWithHttpInfo(contentLength, draftUploadInteropVersion, id, uploadComplete, uploadOffset,  key: key, slug: slug, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// This endpoint requires the `asset.upload` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] contentLength (required):
  ///   Non-negative size of the request body in bytes.
  ///
  /// * [String] draftUploadInteropVersion (required):
  ///   Indicates the version of the RUFH protocol supported by the client.
  ///
  /// * [String] reprDigest (required):
  ///   Structured dictionary containing an SHA-1 checksum used to detect duplicate files and validate data integrity.
  ///
  /// * [String] uploadComplete (required):
  ///   Structured boolean indicating whether this request completes the file. Use Upload-Incomplete instead for version <= 3.
  ///
  /// * [String] xImmichAssetData (required):
  ///   Base64-encoded JSON of asset metadata. The expected content is the same as AssetMediaCreateDto, except that `filename` is required and `sidecarData` is ignored.
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> startUploadWithHttpInfo(String contentLength, String draftUploadInteropVersion, String reprDigest, String uploadComplete, String xImmichAssetData, { String? key, String? slug, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/upload';

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

    headerParams[r'content-length'] = parameterToString(contentLength);
    headerParams[r'draft-upload-interop-version'] = parameterToString(draftUploadInteropVersion);
    headerParams[r'repr-digest'] = parameterToString(reprDigest);
    headerParams[r'upload-complete'] = parameterToString(uploadComplete);
    headerParams[r'x-immich-asset-data'] = parameterToString(xImmichAssetData);

    const contentTypes = <String>[];


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

  /// This endpoint requires the `asset.upload` permission.
  ///
  /// Parameters:
  ///
  /// * [String] contentLength (required):
  ///   Non-negative size of the request body in bytes.
  ///
  /// * [String] draftUploadInteropVersion (required):
  ///   Indicates the version of the RUFH protocol supported by the client.
  ///
  /// * [String] reprDigest (required):
  ///   Structured dictionary containing an SHA-1 checksum used to detect duplicate files and validate data integrity.
  ///
  /// * [String] uploadComplete (required):
  ///   Structured boolean indicating whether this request completes the file. Use Upload-Incomplete instead for version <= 3.
  ///
  /// * [String] xImmichAssetData (required):
  ///   Base64-encoded JSON of asset metadata. The expected content is the same as AssetMediaCreateDto, except that `filename` is required and `sidecarData` is ignored.
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<void> startUpload(String contentLength, String draftUploadInteropVersion, String reprDigest, String uploadComplete, String xImmichAssetData, { String? key, String? slug, }) async {
    final response = await startUploadWithHttpInfo(contentLength, draftUploadInteropVersion, reprDigest, uploadComplete, xImmichAssetData,  key: key, slug: slug, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
