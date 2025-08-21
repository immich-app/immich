//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class NotificationsAdminApi {
  NotificationsAdminApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /admin/notifications' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [NotificationCreateDto] notificationCreateDto (required):
  Future<Response> createNotificationWithHttpInfo(NotificationCreateDto notificationCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/notifications';

    // ignore: prefer_final_locals
    Object? postBody = notificationCreateDto;

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
  /// * [NotificationCreateDto] notificationCreateDto (required):
  Future<NotificationDto?> createNotification(NotificationCreateDto notificationCreateDto,) async {
    final response = await createNotificationWithHttpInfo(notificationCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'NotificationDto',) as NotificationDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /admin/notifications/templates/{name}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] name (required):
  ///
  /// * [TemplateDto] templateDto (required):
  Future<Response> getNotificationTemplateAdminWithHttpInfo(String name, TemplateDto templateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/notifications/templates/{name}'
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
  Future<TemplateResponseDto?> getNotificationTemplateAdmin(String name, TemplateDto templateDto,) async {
    final response = await getNotificationTemplateAdminWithHttpInfo(name, templateDto,);
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

  /// Performs an HTTP 'POST /admin/notifications/test-email' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [SystemConfigSmtpDto] systemConfigSmtpDto (required):
  Future<Response> sendTestEmailAdminWithHttpInfo(SystemConfigSmtpDto systemConfigSmtpDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/notifications/test-email';

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
  Future<TestEmailResponseDto?> sendTestEmailAdmin(SystemConfigSmtpDto systemConfigSmtpDto,) async {
    final response = await sendTestEmailAdminWithHttpInfo(systemConfigSmtpDto,);
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
