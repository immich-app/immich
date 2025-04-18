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

  /// Performs an HTTP 'DELETE /notifications/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteNotificationWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/notifications/{id}'
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

  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteNotification(String id,) async {
    final response = await deleteNotificationWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'DELETE /notifications' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [NotificationDeleteAllDto] notificationDeleteAllDto (required):
  Future<Response> deleteNotificationsWithHttpInfo(NotificationDeleteAllDto notificationDeleteAllDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/notifications';

    // ignore: prefer_final_locals
    Object? postBody = notificationDeleteAllDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


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

  /// Parameters:
  ///
  /// * [NotificationDeleteAllDto] notificationDeleteAllDto (required):
  Future<void> deleteNotifications(NotificationDeleteAllDto notificationDeleteAllDto,) async {
    final response = await deleteNotificationsWithHttpInfo(notificationDeleteAllDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'GET /notifications/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getNotificationWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/notifications/{id}'
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

  /// Parameters:
  ///
  /// * [String] id (required):
  Future<NotificationDto?> getNotification(String id,) async {
    final response = await getNotificationWithHttpInfo(id,);
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

  /// Performs an HTTP 'GET /notifications' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id:
  ///
  /// * [NotificationLevel] level:
  ///
  /// * [NotificationType] type:
  ///
  /// * [bool] unread:
  Future<Response> getNotificationsWithHttpInfo({ String? id, NotificationLevel? level, NotificationType? type, bool? unread, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/notifications';

    // ignore: prefer_final_locals
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
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [String] id:
  ///
  /// * [NotificationLevel] level:
  ///
  /// * [NotificationType] type:
  ///
  /// * [bool] unread:
  Future<List<NotificationDto>?> getNotifications({ String? id, NotificationLevel? level, NotificationType? type, bool? unread, }) async {
    final response = await getNotificationsWithHttpInfo( id: id, level: level, type: type, unread: unread, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<NotificationDto>') as List)
        .cast<NotificationDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Performs an HTTP 'PUT /notifications/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [NotificationUpdateDto] notificationUpdateDto (required):
  Future<Response> updateNotificationWithHttpInfo(String id, NotificationUpdateDto notificationUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/notifications/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = notificationUpdateDto;

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
  /// * [String] id (required):
  ///
  /// * [NotificationUpdateDto] notificationUpdateDto (required):
  Future<NotificationDto?> updateNotification(String id, NotificationUpdateDto notificationUpdateDto,) async {
    final response = await updateNotificationWithHttpInfo(id, notificationUpdateDto,);
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

  /// Performs an HTTP 'PUT /notifications' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [NotificationUpdateAllDto] notificationUpdateAllDto (required):
  Future<Response> updateNotificationsWithHttpInfo(NotificationUpdateAllDto notificationUpdateAllDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/notifications';

    // ignore: prefer_final_locals
    Object? postBody = notificationUpdateAllDto;

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
  /// * [NotificationUpdateAllDto] notificationUpdateAllDto (required):
  Future<void> updateNotifications(NotificationUpdateAllDto notificationUpdateAllDto,) async {
    final response = await updateNotificationsWithHttpInfo(notificationUpdateAllDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
