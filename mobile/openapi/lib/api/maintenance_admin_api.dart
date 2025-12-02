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

  /// Delete report entry and perform corresponding deletion action
  ///
  /// ...
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteIntegrityReportWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/integrity/report/{id}'
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

  /// Delete report entry and perform corresponding deletion action
  ///
  /// ...
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteIntegrityReport(String id,) async {
    final response = await deleteIntegrityReportWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get integrity report by type
  ///
  /// ...
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [MaintenanceGetIntegrityReportDto] maintenanceGetIntegrityReportDto (required):
  Future<Response> getIntegrityReportWithHttpInfo(MaintenanceGetIntegrityReportDto maintenanceGetIntegrityReportDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/integrity/report';

    // ignore: prefer_final_locals
    Object? postBody = maintenanceGetIntegrityReportDto;

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

  /// Get integrity report by type
  ///
  /// ...
  ///
  /// Parameters:
  ///
  /// * [MaintenanceGetIntegrityReportDto] maintenanceGetIntegrityReportDto (required):
  Future<MaintenanceIntegrityReportResponseDto?> getIntegrityReport(MaintenanceGetIntegrityReportDto maintenanceGetIntegrityReportDto,) async {
    final response = await getIntegrityReportWithHttpInfo(maintenanceGetIntegrityReportDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'MaintenanceIntegrityReportResponseDto',) as MaintenanceIntegrityReportResponseDto;
    
    }
    return null;
  }

  /// Export integrity report by type as CSV
  ///
  /// ...
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [IntegrityReportType] type (required):
  Future<Response> getIntegrityReportCsvWithHttpInfo(IntegrityReportType type,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/integrity/report/{type}/csv'
      .replaceAll('{type}', type.toString());

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

  /// Export integrity report by type as CSV
  ///
  /// ...
  ///
  /// Parameters:
  ///
  /// * [IntegrityReportType] type (required):
  Future<MultipartFile?> getIntegrityReportCsv(IntegrityReportType type,) async {
    final response = await getIntegrityReportCsvWithHttpInfo(type,);
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

  /// Download the orphan/broken file if one exists
  ///
  /// ...
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getIntegrityReportFileWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/integrity/report/{id}/file'
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

  /// Download the orphan/broken file if one exists
  ///
  /// ...
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<MultipartFile?> getIntegrityReportFile(String id,) async {
    final response = await getIntegrityReportFileWithHttpInfo(id,);
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

  /// Get integrity report summary
  ///
  /// ...
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getIntegrityReportSummaryWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/integrity/summary';

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

  /// Get integrity report summary
  ///
  /// ...
  Future<MaintenanceIntegrityReportSummaryResponseDto?> getIntegrityReportSummary() async {
    final response = await getIntegrityReportSummaryWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'MaintenanceIntegrityReportSummaryResponseDto',) as MaintenanceIntegrityReportSummaryResponseDto;
    
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
}
