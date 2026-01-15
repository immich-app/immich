//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class GooglePhotosImportApi {
  GooglePhotosImportApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Cancel import job
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> cancelImportWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/google-photos/import/{id}'
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

  /// Cancel import job
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> cancelImport(String id,) async {
    final response = await cancelImportWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Disconnect Google Drive
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> disconnectGoogleDriveWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/google-photos/google-drive/auth';

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

  /// Disconnect Google Drive
  Future<void> disconnectGoogleDrive() async {
    final response = await disconnectGoogleDriveWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get import job progress
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getProgressWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/google-photos/import/{id}/progress'
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

  /// Get import job progress
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<GooglePhotosImportProgressDto?> getProgress(String id,) async {
    final response = await getProgressWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'GooglePhotosImportProgressDto',) as GooglePhotosImportProgressDto;
    
    }
    return null;
  }

  /// Google Drive OAuth callback
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] code (required):
  ///
  /// * [String] error (required):
  ///
  /// * [String] state (required):
  Future<Response> handleGoogleDriveCallbackWithHttpInfo(String code, String error, String state,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/google-photos/google-drive/callback';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'code', code));
      queryParams.addAll(_queryParams('', 'error', error));
      queryParams.addAll(_queryParams('', 'state', state));

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

  /// Google Drive OAuth callback
  ///
  /// Parameters:
  ///
  /// * [String] code (required):
  ///
  /// * [String] error (required):
  ///
  /// * [String] state (required):
  Future<void> handleGoogleDriveCallback(String code, String error, String state,) async {
    final response = await handleGoogleDriveCallbackWithHttpInfo(code, error, state,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Import Google Photos Takeout from Google Drive
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [GooglePhotosImportFromDriveDto] googlePhotosImportFromDriveDto (required):
  Future<Response> importFromDriveWithHttpInfo(GooglePhotosImportFromDriveDto googlePhotosImportFromDriveDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/google-photos/import-from-drive';

    // ignore: prefer_final_locals
    Object? postBody = googlePhotosImportFromDriveDto;

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

  /// Import Google Photos Takeout from Google Drive
  ///
  /// Parameters:
  ///
  /// * [GooglePhotosImportFromDriveDto] googlePhotosImportFromDriveDto (required):
  Future<GooglePhotosImportJobDto?> importFromDrive(GooglePhotosImportFromDriveDto googlePhotosImportFromDriveDto,) async {
    final response = await importFromDriveWithHttpInfo(googlePhotosImportFromDriveDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'GooglePhotosImportJobDto',) as GooglePhotosImportJobDto;
    
    }
    return null;
  }

  /// Import Google Photos Takeout ZIP files
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [List<MultipartFile>] files:
  Future<Response> importFromFilesWithHttpInfo({ List<MultipartFile>? files, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/google-photos/import';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['multipart/form-data'];

    bool hasFields = false;
    final mp = MultipartRequest('POST', Uri.parse(apiPath));
    if (files != null) {
      hasFields = true;
      mp.fields[r'files'] = files.field;
      mp.files.add(files);
    }
    if (hasFields) {
      postBody = mp;
    }

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

  /// Import Google Photos Takeout ZIP files
  ///
  /// Parameters:
  ///
  /// * [List<MultipartFile>] files:
  Future<GooglePhotosImportJobDto?> importFromFiles({ List<MultipartFile>? files, }) async {
    final response = await importFromFilesWithHttpInfo( files: files, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'GooglePhotosImportJobDto',) as GooglePhotosImportJobDto;
    
    }
    return null;
  }

  /// Initiate Google Drive OAuth flow
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> initiateGoogleDriveAuthWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/google-photos/google-drive/auth';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

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

  /// Initiate Google Drive OAuth flow
  Future<void> initiateGoogleDriveAuth() async {
    final response = await initiateGoogleDriveAuthWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// List Takeout files in Google Drive
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] query (required):
  Future<Response> listDriveFilesWithHttpInfo(String query,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/google-photos/google-drive/files';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'query', query));

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

  /// List Takeout files in Google Drive
  ///
  /// Parameters:
  ///
  /// * [String] query (required):
  Future<GoogleDriveFilesResponseDto?> listDriveFiles(String query,) async {
    final response = await listDriveFilesWithHttpInfo(query,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'GoogleDriveFilesResponseDto',) as GoogleDriveFilesResponseDto;
    
    }
    return null;
  }
}
