// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class MaintenanceAdminApi {
  MaintenanceAdminApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion setMaintenanceModeAddedIn = .new(2, 3, 0);

  static const ApiState setMaintenanceModeState = .alpha;

  static const ApiVersion detectPriorInstallAddedIn = .new(2, 5, 0);

  static const ApiState detectPriorInstallState = .alpha;

  static const ApiVersion maintenanceLoginAddedIn = .new(2, 3, 0);

  static const ApiState maintenanceLoginState = .alpha;

  static const ApiVersion getMaintenanceStatusAddedIn = .new(2, 5, 0);

  static const ApiState getMaintenanceStatusState = .alpha;

  /// Set maintenance mode
  ///
  /// Put Immich into or take it out of maintenance mode
  ///
  /// Available since server v2.3.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> setMaintenanceModeWithHttpInfo(
    SetMaintenanceModeDto setMaintenanceModeDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/admin/maintenance';

    Object? postBody = setMaintenanceModeDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

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

  /// Set maintenance mode
  ///
  /// Put Immich into or take it out of maintenance mode
  ///
  /// Available since server v2.3.0.
  Future<void> setMaintenanceMode(SetMaintenanceModeDto setMaintenanceModeDto, {Future<void>? abortTrigger}) async {
    final response = await setMaintenanceModeWithHttpInfo(setMaintenanceModeDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Detect existing install
  ///
  /// Collect integrity checks and other heuristics about local data.
  ///
  /// Available since server v2.5.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> detectPriorInstallWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/admin/maintenance/detect-install';

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

  /// Detect existing install
  ///
  /// Collect integrity checks and other heuristics about local data.
  ///
  /// Available since server v2.5.0.
  Future<MaintenanceDetectInstallResponseDto> detectPriorInstall({Future<void>? abortTrigger}) async {
    final response = await detectPriorInstallWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'MaintenanceDetectInstallResponseDto')
          as MaintenanceDetectInstallResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Log into maintenance mode
  ///
  /// Login with maintenance token or cookie to receive current information and perform further actions.
  ///
  /// Available since server v2.3.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> maintenanceLoginWithHttpInfo(
    MaintenanceLoginDto maintenanceLoginDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/admin/maintenance/login';

    Object? postBody = maintenanceLoginDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

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

  /// Log into maintenance mode
  ///
  /// Login with maintenance token or cookie to receive current information and perform further actions.
  ///
  /// Available since server v2.3.0.
  Future<MaintenanceAuthDto> maintenanceLogin(
    MaintenanceLoginDto maintenanceLoginDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await maintenanceLoginWithHttpInfo(maintenanceLoginDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'MaintenanceAuthDto')
          as MaintenanceAuthDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get maintenance mode status
  ///
  /// Fetch information about the currently running maintenance action.
  ///
  /// Available since server v2.5.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getMaintenanceStatusWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/admin/maintenance/status';

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

  /// Get maintenance mode status
  ///
  /// Fetch information about the currently running maintenance action.
  ///
  /// Available since server v2.5.0.
  Future<MaintenanceStatusResponseDto> getMaintenanceStatus({Future<void>? abortTrigger}) async {
    final response = await getMaintenanceStatusWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'MaintenanceStatusResponseDto')
          as MaintenanceStatusResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
