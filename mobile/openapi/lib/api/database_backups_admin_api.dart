// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class DatabaseBackupsAdminApi {
  DatabaseBackupsAdminApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion deleteDatabaseBackupAddedIn = .new(2, 5, 0);

  static const ApiState deleteDatabaseBackupState = .alpha;

  static const ApiVersion listDatabaseBackupsAddedIn = .new(2, 5, 0);

  static const ApiState listDatabaseBackupsState = .alpha;

  static const ApiVersion startDatabaseRestoreFlowAddedIn = .new(2, 5, 0);

  static const ApiState startDatabaseRestoreFlowState = .alpha;

  static const ApiVersion uploadDatabaseBackupAddedIn = .new(2, 5, 0);

  static const ApiState uploadDatabaseBackupState = .alpha;

  static const ApiVersion downloadDatabaseBackupAddedIn = .new(2, 5, 0);

  static const ApiState downloadDatabaseBackupState = .alpha;

  /// Delete database backup
  ///
  /// Delete a backup by its filename
  ///
  /// Available since server v2.5.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteDatabaseBackupWithHttpInfo(
    DatabaseBackupDeleteDto databaseBackupDeleteDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/admin/database-backups';

    Object? postBody = databaseBackupDeleteDto;

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

  /// Delete database backup
  ///
  /// Delete a backup by its filename
  ///
  /// Available since server v2.5.0.
  Future<void> deleteDatabaseBackup(
    DatabaseBackupDeleteDto databaseBackupDeleteDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await deleteDatabaseBackupWithHttpInfo(databaseBackupDeleteDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// List database backups
  ///
  /// Get the list of the successful and failed backups
  ///
  /// Available since server v2.5.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> listDatabaseBackupsWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/admin/database-backups';

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

  /// List database backups
  ///
  /// Get the list of the successful and failed backups
  ///
  /// Available since server v2.5.0.
  Future<DatabaseBackupListResponseDto> listDatabaseBackups({Future<void>? abortTrigger}) async {
    final response = await listDatabaseBackupsWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'DatabaseBackupListResponseDto')
          as DatabaseBackupListResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Start database backup restore flow
  ///
  /// Put Immich into maintenance mode to restore a backup (Immich must not be configured)
  ///
  /// Available since server v2.5.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> startDatabaseRestoreFlowWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/admin/database-backups/start-restore';

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

  /// Start database backup restore flow
  ///
  /// Put Immich into maintenance mode to restore a backup (Immich must not be configured)
  ///
  /// Available since server v2.5.0.
  Future<void> startDatabaseRestoreFlow({Future<void>? abortTrigger}) async {
    final response = await startDatabaseRestoreFlowWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Upload database backup
  ///
  /// Uploads .sql/.sql.gz file to restore backup from
  ///
  /// Available since server v2.5.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> uploadDatabaseBackupWithHttpInfo({MultipartFile? file, Future<void>? abortTrigger}) async {
    final apiPath = r'/admin/database-backups/upload';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'multipart/form-data'];

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
      r'POST',
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
  /// Available since server v2.5.0.
  Future<void> uploadDatabaseBackup({MultipartFile? file, Future<void>? abortTrigger}) async {
    final response = await uploadDatabaseBackupWithHttpInfo(file: file, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Download database backup
  ///
  /// Downloads the database backup file
  ///
  /// Available since server v2.5.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> downloadDatabaseBackupWithHttpInfo(String filename, {Future<void>? abortTrigger}) async {
    final apiPath = r'/admin/database-backups/{filename}'.replaceAll('{filename}', filename);

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

  /// Download database backup
  ///
  /// Downloads the database backup file
  ///
  /// Available since server v2.5.0.
  Future<Uint8List> downloadDatabaseBackup(String filename, {Future<void>? abortTrigger}) async {
    final response = await downloadDatabaseBackupWithHttpInfo(filename, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    return response.bodyBytes;
  }
}
