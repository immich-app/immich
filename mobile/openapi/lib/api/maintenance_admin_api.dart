//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class MaintenanceAdminApi {
  MaintenanceAdminApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Delete backup
  ///
  /// Delete a backup by its filename
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] filename (required):
  Future<Response> deleteBackupWithHttpInfo(String filename,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/backups/{filename}'
      .replaceAll('{filename}', filename);

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

  /// Delete backup
  ///
  /// Delete a backup by its filename
  ///
  /// Parameters:
  ///
  /// * [String] filename (required):
  Future<void> deleteBackup(String filename,) async {
    final response = await deleteBackupWithHttpInfo(filename,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Download backup
  ///
  /// Downloads the database backup file
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] filename (required):
  Future<Response> downloadBackupWithHttpInfo(String filename,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/backups/{filename}'
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
    );
  }

  /// Download backup
  ///
  /// Downloads the database backup file
  ///
  /// Parameters:
  ///
  /// * [String] filename (required):
  Future<MultipartFile?> downloadBackup(String filename,) async {
    final response = await downloadBackupWithHttpInfo(filename,);
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

  /// Get integrity and heuristics
  ///
  /// Collect integrity checks and other heuristics about local data.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> integrityCheckWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/integrity';

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

  /// Get integrity and heuristics
  ///
  /// Collect integrity checks and other heuristics about local data.
  Future<MaintenanceIntegrityResponseDto?> integrityCheck() async {
    final response = await integrityCheckWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'MaintenanceIntegrityResponseDto',) as MaintenanceIntegrityResponseDto;
    
    }
    return null;
  }

  /// List backups
  ///
  /// Get the list of the successful and failed backups
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> listBackupsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/backups/list';

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

  /// List backups
  ///
  /// Get the list of the successful and failed backups
  Future<MaintenanceListBackupsResponseDto?> listBackups() async {
    final response = await listBackupsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'MaintenanceListBackupsResponseDto',) as MaintenanceListBackupsResponseDto;
    
    }
    return null;
  }

  /// Log into maintenance mode
  ///
  /// Login with maintenance token or cookie to receive current information and perform further actions.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [MaintenanceLoginDto] maintenanceLoginDto (required):
  Future<Response> maintenanceLoginWithHttpInfo(MaintenanceLoginDto maintenanceLoginDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/login';

    // ignore: prefer_final_locals
    Object? postBody = maintenanceLoginDto;

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

  /// Log into maintenance mode
  ///
  /// Login with maintenance token or cookie to receive current information and perform further actions.
  ///
  /// Parameters:
  ///
  /// * [MaintenanceLoginDto] maintenanceLoginDto (required):
  Future<MaintenanceAuthDto?> maintenanceLogin(MaintenanceLoginDto maintenanceLoginDto,) async {
    final response = await maintenanceLoginWithHttpInfo(maintenanceLoginDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'MaintenanceAuthDto',) as MaintenanceAuthDto;
    
    }
    return null;
  }

  /// Get maintenance mode status
  ///
  /// Fetch information about the currently running maintenance action.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> maintenanceStatusWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/status';

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

  /// Get maintenance mode status
  ///
  /// Fetch information about the currently running maintenance action.
  Future<MaintenanceStatusResponseDto?> maintenanceStatus() async {
    final response = await maintenanceStatusWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'MaintenanceStatusResponseDto',) as MaintenanceStatusResponseDto;
    
    }
    return null;
  }

  /// Set maintenance mode
  ///
  /// Put Immich into or take it out of maintenance mode
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [SetMaintenanceModeDto] setMaintenanceModeDto (required):
  Future<Response> setMaintenanceModeWithHttpInfo(SetMaintenanceModeDto setMaintenanceModeDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance';

    // ignore: prefer_final_locals
    Object? postBody = setMaintenanceModeDto;

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

  /// Set maintenance mode
  ///
  /// Put Immich into or take it out of maintenance mode
  ///
  /// Parameters:
  ///
  /// * [SetMaintenanceModeDto] setMaintenanceModeDto (required):
  Future<void> setMaintenanceMode(SetMaintenanceModeDto setMaintenanceModeDto,) async {
    final response = await setMaintenanceModeWithHttpInfo(setMaintenanceModeDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Start backup restore flow
  ///
  /// Put Immich into maintenance mode to restore a backup (Immich must not be configured)
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> startRestoreFlowWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/backups/restore';

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

  /// Start backup restore flow
  ///
  /// Put Immich into maintenance mode to restore a backup (Immich must not be configured)
  Future<void> startRestoreFlow() async {
    final response = await startRestoreFlowWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Upload asset
  ///
  /// Uploads a new asset to the server.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [MultipartFile] file:
  Future<Response> uploadBackupWithHttpInfo({ MultipartFile? file, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/backups/upload';

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
    );
  }

  /// Upload asset
  ///
  /// Uploads a new asset to the server.
  ///
  /// Parameters:
  ///
  /// * [MultipartFile] file:
  Future<void> uploadBackup({ MultipartFile? file, }) async {
    final response = await uploadBackupWithHttpInfo( file: file, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
