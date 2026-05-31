// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class NotificationsAdminApi {
  NotificationsAdminApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion createNotificationAddedIn = .new(1, 0, 0);

  static const ApiState createNotificationState = .stable;

  static const ApiVersion getNotificationTemplateAdminAddedIn = .new(1, 0, 0);

  static const ApiState getNotificationTemplateAdminState = .stable;

  static const ApiVersion sendTestEmailAdminAddedIn = .new(1, 0, 0);

  static const ApiState sendTestEmailAdminState = .stable;

  /// Create a notification
  ///
  /// Create a new notification for a specific user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createNotificationWithHttpInfo(
    NotificationCreateDto notificationCreateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/admin/notifications';

    Object? postBody = notificationCreateDto;

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

  /// Create a notification
  ///
  /// Create a new notification for a specific user.
  ///
  /// Available since server v1.0.0.
  Future<NotificationDto> createNotification(
    NotificationCreateDto notificationCreateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await createNotificationWithHttpInfo(notificationCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'NotificationDto') as NotificationDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Render email template
  ///
  /// Retrieve a preview of the provided email template.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getNotificationTemplateAdminWithHttpInfo(
    String name,
    TemplateDto templateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/admin/notifications/templates/{name}'.replaceAll('{name}', name);

    Object? postBody = templateDto;

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

  /// Render email template
  ///
  /// Retrieve a preview of the provided email template.
  ///
  /// Available since server v1.0.0.
  Future<TemplateResponseDto> getNotificationTemplateAdmin(
    String name,
    TemplateDto templateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await getNotificationTemplateAdminWithHttpInfo(name, templateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'TemplateResponseDto')
          as TemplateResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Send test email
  ///
  /// Send a test email using the provided SMTP configuration.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> sendTestEmailAdminWithHttpInfo(
    SystemConfigSmtpDto systemConfigSmtpDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/admin/notifications/test-email';

    Object? postBody = systemConfigSmtpDto;

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

  /// Send test email
  ///
  /// Send a test email using the provided SMTP configuration.
  ///
  /// Available since server v1.0.0.
  Future<TestEmailResponseDto> sendTestEmailAdmin(
    SystemConfigSmtpDto systemConfigSmtpDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await sendTestEmailAdminWithHttpInfo(systemConfigSmtpDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'TestEmailResponseDto')
          as TestEmailResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
