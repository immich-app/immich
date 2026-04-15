//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class OnboardingApi {
  OnboardingApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /yucca/onboarding/recovery-key' operation and returns the [Response].
  Future<Response> confirmRecoveryKeyWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/onboarding/recovery-key';

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

  Future<void> confirmRecoveryKey() async {
    final response = await confirmRecoveryKeyWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'GET /yucca/onboarding/recovery-key' operation and returns the [Response].
  Future<Response> currentRecoveryKeyWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/onboarding/recovery-key';

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

  Future<CurrentRecoveryKeyResponse?> currentRecoveryKey() async {
    final response = await currentRecoveryKeyWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'CurrentRecoveryKeyResponse',) as CurrentRecoveryKeyResponse;
    
    }
    return null;
  }

  /// Performs an HTTP 'PUT /yucca/onboarding/recovery-key' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [ImportRecoveryKeyRequest] importRecoveryKeyRequest (required):
  Future<Response> importRecoveryKeyWithHttpInfo(ImportRecoveryKeyRequest importRecoveryKeyRequest,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/onboarding/recovery-key';

    // ignore: prefer_final_locals
    Object? postBody = importRecoveryKeyRequest;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      apiPath,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [ImportRecoveryKeyRequest] importRecoveryKeyRequest (required):
  Future<void> importRecoveryKey(ImportRecoveryKeyRequest importRecoveryKeyRequest,) async {
    final response = await importRecoveryKeyWithHttpInfo(importRecoveryKeyRequest,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'GET /yucca/onboarding' operation and returns the [Response].
  Future<Response> onboardingStatusWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/onboarding';

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

  Future<OnboardingStatusResponseDto?> onboardingStatus() async {
    final response = await onboardingStatusWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'OnboardingStatusResponseDto',) as OnboardingStatusResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /yucca/onboarding/skip' operation and returns the [Response].
  Future<Response> skipOnboardingExtraConfigWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/onboarding/skip';

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

  Future<void> skipOnboardingExtraConfig() async {
    final response = await skipOnboardingExtraConfigWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
