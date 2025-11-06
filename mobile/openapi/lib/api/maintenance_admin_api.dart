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

  /// This endpoint is an admin-only route, and requires the `maintenance` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> endMaintenanceWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/end';

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

  /// This endpoint is an admin-only route, and requires the `maintenance` permission.
  Future<void> endMaintenance() async {
    final response = await endMaintenanceWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'POST /admin/maintenance/login' operation and returns the [Response].
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

  /// This endpoint is an admin-only route, and requires the `maintenance` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> startMaintenanceWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/maintenance/start';

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

  /// This endpoint is an admin-only route, and requires the `maintenance` permission.
  Future<void> startMaintenance() async {
    final response = await startMaintenanceWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
