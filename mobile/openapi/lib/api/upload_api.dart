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

  /// Performs an HTTP 'OPTIONS /upload' operation and returns the [Response].
  Future<Response> getUploadOptionsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/upload';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

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

  Future<void> getUploadOptions() async {
    final response = await getUploadOptionsWithHttpInfo();
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
  /// * [String] id (required):
  ///
  /// * [String] uploadDraftInteropVersion (required):
  ///   Indicates the version of the RUFH protocol supported by the client.
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> getUploadStatusWithHttpInfo(String id, String uploadDraftInteropVersion, { String? key, String? slug, }) async {
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

    headerParams[r'upload-draft-interop-version'] = parameterToString(uploadDraftInteropVersion);

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
  /// * [String] id (required):
  ///
  /// * [String] uploadDraftInteropVersion (required):
  ///   Indicates the version of the RUFH protocol supported by the client.
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<void> getUploadStatus(String id, String uploadDraftInteropVersion, { String? key, String? slug, }) async {
    final response = await getUploadStatusWithHttpInfo(id, uploadDraftInteropVersion,  key: key, slug: slug, );
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
  /// * [String] id (required):
  ///
  /// * [String] uploadComplete (required):
  ///   Structured boolean indicating whether this request completes the file. Use Upload-Incomplete instead for version <= 3.
  ///
  /// * [String] uploadDraftInteropVersion (required):
  ///   Indicates the version of the RUFH protocol supported by the client.
  ///
  /// * [String] uploadOffset (required):
  ///   Non-negative byte offset indicating the starting position of the data in the request body within the entire file.
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<Response> resumeUploadWithHttpInfo(String contentLength, String id, String uploadComplete, String uploadDraftInteropVersion, String uploadOffset, { String? key, String? slug, }) async {
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
    headerParams[r'upload-complete'] = parameterToString(uploadComplete);
    headerParams[r'upload-draft-interop-version'] = parameterToString(uploadDraftInteropVersion);
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
  /// * [String] id (required):
  ///
  /// * [String] uploadComplete (required):
  ///   Structured boolean indicating whether this request completes the file. Use Upload-Incomplete instead for version <= 3.
  ///
  /// * [String] uploadDraftInteropVersion (required):
  ///   Indicates the version of the RUFH protocol supported by the client.
  ///
  /// * [String] uploadOffset (required):
  ///   Non-negative byte offset indicating the starting position of the data in the request body within the entire file.
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  Future<UploadOkDto?> resumeUpload(String contentLength, String id, String uploadComplete, String uploadDraftInteropVersion, String uploadOffset, { String? key, String? slug, }) async {
    final response = await resumeUploadWithHttpInfo(contentLength, id, uploadComplete, uploadDraftInteropVersion, uploadOffset,  key: key, slug: slug, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UploadOkDto',) as UploadOkDto;
    
    }
    return null;
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
  /// * [String] reprDigest (required):
  ///   RFC 9651 structured dictionary containing an `sha` (bytesequence) checksum used to detect duplicate files and validate data integrity.
  ///
  /// * [String] xImmichAssetData (required):
  ///   RFC 9651 structured dictionary containing asset metadata with the following keys: - device-asset-id (string, required): Unique device asset identifier - device-id (string, required): Device identifier - file-created-at (string/date, required): ISO 8601 date string or Unix timestamp - file-modified-at (string/date, required): ISO 8601 date string or Unix timestamp - filename (string, required): Original filename - is-favorite (boolean, optional): Favorite status - live-photo-video-id (string, optional): Live photo ID for assets from iOS devices - icloud-id (string, optional): iCloud identifier for assets from iOS devices
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  ///
  /// * [String] uploadComplete:
  ///   Structured boolean indicating whether this request completes the file. Use Upload-Incomplete instead for version <= 3.
  ///
  /// * [String] uploadDraftInteropVersion:
  ///   Indicates the version of the RUFH protocol supported by the client.
  Future<Response> startUploadWithHttpInfo(String contentLength, String reprDigest, String xImmichAssetData, { String? key, String? slug, String? uploadComplete, String? uploadDraftInteropVersion, }) async {
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
    headerParams[r'repr-digest'] = parameterToString(reprDigest);
    if (uploadComplete != null) {
      headerParams[r'upload-complete'] = parameterToString(uploadComplete);
    }
    if (uploadDraftInteropVersion != null) {
      headerParams[r'upload-draft-interop-version'] = parameterToString(uploadDraftInteropVersion);
    }
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
  /// * [String] reprDigest (required):
  ///   RFC 9651 structured dictionary containing an `sha` (bytesequence) checksum used to detect duplicate files and validate data integrity.
  ///
  /// * [String] xImmichAssetData (required):
  ///   RFC 9651 structured dictionary containing asset metadata with the following keys: - device-asset-id (string, required): Unique device asset identifier - device-id (string, required): Device identifier - file-created-at (string/date, required): ISO 8601 date string or Unix timestamp - file-modified-at (string/date, required): ISO 8601 date string or Unix timestamp - filename (string, required): Original filename - is-favorite (boolean, optional): Favorite status - live-photo-video-id (string, optional): Live photo ID for assets from iOS devices - icloud-id (string, optional): iCloud identifier for assets from iOS devices
  ///
  /// * [String] key:
  ///
  /// * [String] slug:
  ///
  /// * [String] uploadComplete:
  ///   Structured boolean indicating whether this request completes the file. Use Upload-Incomplete instead for version <= 3.
  ///
  /// * [String] uploadDraftInteropVersion:
  ///   Indicates the version of the RUFH protocol supported by the client.
  Future<UploadOkDto?> startUpload(String contentLength, String reprDigest, String xImmichAssetData, { String? key, String? slug, String? uploadComplete, String? uploadDraftInteropVersion, }) async {
    final response = await startUploadWithHttpInfo(contentLength, reprDigest, xImmichAssetData,  key: key, slug: slug, uploadComplete: uploadComplete, uploadDraftInteropVersion: uploadDraftInteropVersion, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UploadOkDto',) as UploadOkDto;
    
    }
    return null;
  }
}
