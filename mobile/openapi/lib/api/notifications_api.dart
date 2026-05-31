// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class NotificationsApi {
  NotificationsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion deleteNotificationsAddedIn = .new(1, 0, 0);

  static const ApiState deleteNotificationsState = .stable;

  static const ApiVersion getNotificationsAddedIn = .new(1, 0, 0);

  static const ApiState getNotificationsState = .stable;

  static const ApiVersion updateNotificationsAddedIn = .new(1, 0, 0);

  static const ApiState updateNotificationsState = .stable;

  static const ApiVersion deleteNotificationAddedIn = .new(1, 0, 0);

  static const ApiState deleteNotificationState = .stable;

  static const ApiVersion getNotificationAddedIn = .new(1, 0, 0);

  static const ApiState getNotificationState = .stable;

  static const ApiVersion updateNotificationAddedIn = .new(1, 0, 0);

  static const ApiState updateNotificationState = .stable;

  /// Delete notifications
  ///
  /// Delete a list of notifications at once.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteNotificationsWithHttpInfo(
    NotificationDeleteAllDto notificationDeleteAllDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/notifications';

    Object? postBody = notificationDeleteAllDto;

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

  /// Delete notifications
  ///
  /// Delete a list of notifications at once.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteNotifications(
    NotificationDeleteAllDto notificationDeleteAllDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await deleteNotificationsWithHttpInfo(notificationDeleteAllDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve notifications
  ///
  /// Retrieve a list of notifications.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getNotificationsWithHttpInfo({
    String? id,
    NotificationLevel? level,
    NotificationType? type,
    bool? unread,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/notifications';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (id != null) {
      queryParams.addAll(_queryParams('', 'id', id));
    }
    if (level != null) {
      queryParams.addAll(_queryParams('', 'level', level));
    }
    if (type != null) {
      queryParams.addAll(_queryParams('', 'type', type));
    }
    if (unread != null) {
      queryParams.addAll(_queryParams('', 'unread', unread));
    }

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

  /// Retrieve notifications
  ///
  /// Retrieve a list of notifications.
  ///
  /// Available since server v1.0.0.
  Future<List<NotificationDto>> getNotifications({
    String? id,
    NotificationLevel? level,
    NotificationType? type,
    bool? unread,
    Future<void>? abortTrigger,
  }) async {
    final response = await getNotificationsWithHttpInfo(
      id: id,
      level: level,
      type: type,
      unread: unread,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<NotificationDto>') as List)
          .cast<NotificationDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update notifications
  ///
  /// Update a list of notifications. Allows to bulk-set the read status of notifications.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateNotificationsWithHttpInfo(
    NotificationUpdateAllDto notificationUpdateAllDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/notifications';

    Object? postBody = notificationUpdateAllDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Update notifications
  ///
  /// Update a list of notifications. Allows to bulk-set the read status of notifications.
  ///
  /// Available since server v1.0.0.
  Future<void> updateNotifications(
    NotificationUpdateAllDto notificationUpdateAllDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateNotificationsWithHttpInfo(notificationUpdateAllDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Delete a notification
  ///
  /// Delete a specific notification.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteNotificationWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/notifications/{id}'.replaceAll('{id}', id);

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

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

  /// Delete a notification
  ///
  /// Delete a specific notification.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteNotification(String id, {Future<void>? abortTrigger}) async {
    final response = await deleteNotificationWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get a notification
  ///
  /// Retrieve a specific notification identified by id.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getNotificationWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/notifications/{id}'.replaceAll('{id}', id);

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

  /// Get a notification
  ///
  /// Retrieve a specific notification identified by id.
  ///
  /// Available since server v1.0.0.
  Future<NotificationDto> getNotification(String id, {Future<void>? abortTrigger}) async {
    final response = await getNotificationWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'NotificationDto') as NotificationDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update a notification
  ///
  /// Update a specific notification to set its read status.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateNotificationWithHttpInfo(
    String id,
    NotificationUpdateDto notificationUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/notifications/{id}'.replaceAll('{id}', id);

    Object? postBody = notificationUpdateDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Update a notification
  ///
  /// Update a specific notification to set its read status.
  ///
  /// Available since server v1.0.0.
  Future<NotificationDto> updateNotification(
    String id,
    NotificationUpdateDto notificationUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateNotificationWithHttpInfo(id, notificationUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'NotificationDto') as NotificationDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
