//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class NotificationsApi {
  NotificationsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /notifications/templates/{name}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] name (required):
  ///
  /// * [TemplateDto] templateDto (required):
  Future<Response> getNotificationTemplateWithHttpInfo(String name, TemplateDto templateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/notifications/templates/{name}'
      .replaceAll('{name}', name);

    // ignore: prefer_final_locals
    Object? postBody = templateDto;

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
  /// * [String] name (required):
  ///
  /// * [TemplateDto] templateDto (required):
  Future<TemplateResponseDto?> getNotificationTemplate(String name, TemplateDto templateDto,) async {
    final response = await getNotificationTemplateWithHttpInfo(name, templateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'TemplateResponseDto',) as TemplateResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /notifications/test-email' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [SystemConfigSmtpDto] systemConfigSmtpDto (required):
  Future<Response> sendTestEmailWithHttpInfo(SystemConfigSmtpDto systemConfigSmtpDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/notifications/test-email';

    // ignore: prefer_final_locals
    Object? postBody = systemConfigSmtpDto;

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
  /// * [SystemConfigSmtpDto] systemConfigSmtpDto (required):
  Future<TestEmailResponseDto?> sendTestEmail(SystemConfigSmtpDto systemConfigSmtpDto,) async {
    final response = await sendTestEmailWithHttpInfo(systemConfigSmtpDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'TestEmailResponseDto',) as TestEmailResponseDto;
    
    }
    return null;
  }
}
