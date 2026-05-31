// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class SystemMetadataApi {
  SystemMetadataApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getAdminOnboardingAddedIn = .new(1, 0, 0);

  static const ApiState getAdminOnboardingState = .stable;

  static const ApiVersion updateAdminOnboardingAddedIn = .new(1, 0, 0);

  static const ApiState updateAdminOnboardingState = .stable;

  static const ApiVersion getReverseGeocodingStateAddedIn = .new(1, 0, 0);

  static const ApiState getReverseGeocodingStateState = .stable;

  static const ApiVersion getVersionCheckStateAddedIn = .new(1, 0, 0);

  static const ApiState getVersionCheckStateState = .stable;

  /// Retrieve admin onboarding
  ///
  /// Retrieve the current admin onboarding status.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAdminOnboardingWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/system-metadata/admin-onboarding';

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

  /// Retrieve admin onboarding
  ///
  /// Retrieve the current admin onboarding status.
  ///
  /// Available since server v1.0.0.
  Future<AdminOnboardingUpdateDto> getAdminOnboarding({Future<void>? abortTrigger}) async {
    final response = await getAdminOnboardingWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AdminOnboardingUpdateDto')
          as AdminOnboardingUpdateDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update admin onboarding
  ///
  /// Update the admin onboarding status.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateAdminOnboardingWithHttpInfo(
    AdminOnboardingUpdateDto adminOnboardingUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/system-metadata/admin-onboarding';

    Object? postBody = adminOnboardingUpdateDto;

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

  /// Update admin onboarding
  ///
  /// Update the admin onboarding status.
  ///
  /// Available since server v1.0.0.
  Future<void> updateAdminOnboarding(
    AdminOnboardingUpdateDto adminOnboardingUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateAdminOnboardingWithHttpInfo(adminOnboardingUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve reverse geocoding state
  ///
  /// Retrieve the current state of the reverse geocoding import.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getReverseGeocodingStateWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/system-metadata/reverse-geocoding-state';

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

  /// Retrieve reverse geocoding state
  ///
  /// Retrieve the current state of the reverse geocoding import.
  ///
  /// Available since server v1.0.0.
  Future<ReverseGeocodingStateResponseDto> getReverseGeocodingState({Future<void>? abortTrigger}) async {
    final response = await getReverseGeocodingStateWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ReverseGeocodingStateResponseDto')
          as ReverseGeocodingStateResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve version check state
  ///
  /// Retrieve the current state of the version check process.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getVersionCheckStateWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/system-metadata/version-check-state';

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

  /// Retrieve version check state
  ///
  /// Retrieve the current state of the version check process.
  ///
  /// Available since server v1.0.0.
  Future<VersionCheckStateResponseDto> getVersionCheckState({Future<void>? abortTrigger}) async {
    final response = await getVersionCheckStateWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'VersionCheckStateResponseDto')
          as VersionCheckStateResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
