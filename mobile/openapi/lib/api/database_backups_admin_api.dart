//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class DatabaseBackupsAdminApi {
  DatabaseBackupsAdminApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Delete database backup
  ///
  /// Delete a backup by its filename
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [DatabaseBackupDeleteDto] databaseBackupDeleteDto (required):
  Future<Response> deleteDatabaseBackupWithHttpInfo(DatabaseBackupDeleteDto databaseBackupDeleteDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/database-backups';

    // ignore: prefer_final_locals
    Object? postBody = databaseBackupDeleteDto;

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
      abortTrigger: abortTrigger,
    );
  }

  /// Delete database backup
  ///
  /// Delete a backup by its filename
  ///
  /// Parameters:
  ///
  /// * [DatabaseBackupDeleteDto] databaseBackupDeleteDto (required):
  Future<void> deleteDatabaseBackup(DatabaseBackupDeleteDto databaseBackupDeleteDto, { Future<void>? abortTrigger, }) async {
    final response = await deleteDatabaseBackupWithHttpInfo(databaseBackupDeleteDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Download database backup
  ///
  /// Downloads the database backup file
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] filename (required):
  Future<Response> downloadDatabaseBackupWithHttpInfo(String filename, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/database-backups/{filename}'
      .replaceAll('{filename}', filename);

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
      abortTrigger: abortTrigger,
    );
  }

  /// Download database backup
  ///
  /// Downloads the database backup file
  ///
  /// Parameters:
  ///
  /// * [String] filename (required):
  Future<MultipartFile?> downloadDatabaseBackup(String filename, { Future<void>? abortTrigger, }) async {
    final response = await downloadDatabaseBackupWithHttpInfo(filename, abortTrigger: abortTrigger,);
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

  /// List database backups
  ///
  /// Get the list of the successful and failed backups
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> listDatabaseBackupsWithHttpInfo({ Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/database-backups';

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
      abortTrigger: abortTrigger,
    );
  }

  /// List database backups
  ///
  /// Get the list of the successful and failed backups
  Future<DatabaseBackupListResponseDto?> listDatabaseBackups({ Future<void>? abortTrigger, }) async {
    final response = await listDatabaseBackupsWithHttpInfo(abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'DatabaseBackupListResponseDto',) as DatabaseBackupListResponseDto;
    
    }
    return null;
  }

  /// Start database backup restore flow
  ///
  /// Put Immich into maintenance mode to restore a backup (Immich must not be configured)
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> startDatabaseRestoreFlowWithHttpInfo({ Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/database-backups/start-restore';

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
      abortTrigger: abortTrigger,
    );
  }

  /// Start database backup restore flow
  ///
  /// Put Immich into maintenance mode to restore a backup (Immich must not be configured)
  Future<void> startDatabaseRestoreFlow({ Future<void>? abortTrigger, }) async {
    final response = await startDatabaseRestoreFlowWithHttpInfo(abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Upload database backup
  ///
  /// Uploads .sql/.sql.gz file to restore backup from
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [MultipartFile] file:
  ///   Database backup file
  Future<Response> uploadDatabaseBackupWithHttpInfo({ MultipartFile? file, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/database-backups/upload';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['multipart/form-data'];

    bool hasFields = false;
    final mp = MultipartRequest('POST', Uri.parse(apiPath));
    if (file != null) {
      hasFields = true;
      mp.fields[r'file'] = file.field;
      mp.files.add(file);
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
      abortTrigger: abortTrigger,
    );
  }

  /// Upload database backup
  ///
  /// Uploads .sql/.sql.gz file to restore backup from
  ///
  /// Parameters:
  ///
  /// * [MultipartFile] file:
  ///   Database backup file
  Future<void> uploadDatabaseBackup({ MultipartFile? file, Future<void>? abortTrigger, }) async {
    final response = await uploadDatabaseBackupWithHttpInfo(file: file, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
