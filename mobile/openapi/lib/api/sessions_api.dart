// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class SessionsApi {
  SessionsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion deleteAllSessionsAddedIn = .new(1, 0, 0);

  static const ApiState deleteAllSessionsState = .stable;

  static const ApiVersion getSessionsAddedIn = .new(1, 0, 0);

  static const ApiState getSessionsState = .stable;

  static const ApiVersion createSessionAddedIn = .new(1, 0, 0);

  static const ApiState createSessionState = .stable;

  static const ApiVersion deleteSessionAddedIn = .new(1, 0, 0);

  static const ApiState deleteSessionState = .stable;

  static const ApiVersion updateSessionAddedIn = .new(1, 0, 0);

  static const ApiState updateSessionState = .stable;

  static const ApiVersion lockSessionAddedIn = .new(1, 0, 0);

  static const ApiState lockSessionState = .stable;

  /// Delete all sessions
  ///
  /// Delete all sessions for the user. This will not delete the current session.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteAllSessionsWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/sessions';

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

  /// Delete all sessions
  ///
  /// Delete all sessions for the user. This will not delete the current session.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteAllSessions({Future<void>? abortTrigger}) async {
    final response = await deleteAllSessionsWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve sessions
  ///
  /// Retrieve a list of sessions for the user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getSessionsWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/sessions';

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

  /// Retrieve sessions
  ///
  /// Retrieve a list of sessions for the user.
  ///
  /// Available since server v1.0.0.
  Future<List<SessionResponseDto>> getSessions({Future<void>? abortTrigger}) async {
    final response = await getSessionsWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<SessionResponseDto>') as List)
          .cast<SessionResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create a session
  ///
  /// Create a session as a child to the current session. This endpoint is used for casting.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createSessionWithHttpInfo(SessionCreateDto sessionCreateDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/sessions';

    Object? postBody = sessionCreateDto;

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

  /// Create a session
  ///
  /// Create a session as a child to the current session. This endpoint is used for casting.
  ///
  /// Available since server v1.0.0.
  Future<SessionCreateResponseDto> createSession(
    SessionCreateDto sessionCreateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await createSessionWithHttpInfo(sessionCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'SessionCreateResponseDto')
          as SessionCreateResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete a session
  ///
  /// Delete a specific session by id.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteSessionWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/sessions/{id}'.replaceAll('{id}', id);

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

  /// Delete a session
  ///
  /// Delete a specific session by id.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteSession(String id, {Future<void>? abortTrigger}) async {
    final response = await deleteSessionWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Update a session
  ///
  /// Update a specific session identified by id.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateSessionWithHttpInfo(
    String id,
    SessionUpdateDto sessionUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/sessions/{id}'.replaceAll('{id}', id);

    Object? postBody = sessionUpdateDto;

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

  /// Update a session
  ///
  /// Update a specific session identified by id.
  ///
  /// Available since server v1.0.0.
  Future<SessionResponseDto> updateSession(
    String id,
    SessionUpdateDto sessionUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateSessionWithHttpInfo(id, sessionUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'SessionResponseDto')
          as SessionResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Lock a session
  ///
  /// Lock a specific session by id.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> lockSessionWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/sessions/{id}/lock'.replaceAll('{id}', id);

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

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

  /// Lock a session
  ///
  /// Lock a specific session by id.
  ///
  /// Available since server v1.0.0.
  Future<void> lockSession(String id, {Future<void>? abortTrigger}) async {
    final response = await lockSessionWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
