//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SessionsApi {
  SessionsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create a session
  ///
  /// Create a session as a child to the current session. This endpoint is used for casting.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [SessionCreateDto] sessionCreateDto (required):
  Future<Response> createSessionWithHttpInfo(SessionCreateDto sessionCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sessions';

    // ignore: prefer_final_locals
    Object? postBody = sessionCreateDto;

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

  /// Create a session
  ///
  /// Create a session as a child to the current session. This endpoint is used for casting.
  ///
  /// Parameters:
  ///
  /// * [SessionCreateDto] sessionCreateDto (required):
  Future<SessionCreateResponseDto?> createSession(SessionCreateDto sessionCreateDto,) async {
    final response = await createSessionWithHttpInfo(sessionCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SessionCreateResponseDto',) as SessionCreateResponseDto;
    
    }
    return null;
  }

  /// Delete all sessions
  ///
  /// Delete all sessions for the user. This will not delete the current session.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteAllSessionsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sessions';

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

  /// Delete all sessions
  ///
  /// Delete all sessions for the user. This will not delete the current session.
  Future<void> deleteAllSessions() async {
    final response = await deleteAllSessionsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Delete a session
  ///
  /// Delete a specific session by id.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteSessionWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sessions/{id}'
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

  /// Delete a session
  ///
  /// Delete a specific session by id.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteSession(String id,) async {
    final response = await deleteSessionWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve sessions
  ///
  /// Retrieve a list of sessions for the user.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getSessionsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sessions';

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

  /// Retrieve sessions
  ///
  /// Retrieve a list of sessions for the user.
  Future<List<SessionResponseDto>?> getSessions() async {
    final response = await getSessionsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<SessionResponseDto>') as List)
        .cast<SessionResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Lock a session
  ///
  /// Lock a specific session by id.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> lockSessionWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sessions/{id}/lock'
      .replaceAll('{id}', id);

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

  /// Lock a session
  ///
  /// Lock a specific session by id.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> lockSession(String id,) async {
    final response = await lockSessionWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Update a session
  ///
  /// Update a specific session identified by id.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SessionUpdateDto] sessionUpdateDto (required):
  Future<Response> updateSessionWithHttpInfo(String id, SessionUpdateDto sessionUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sessions/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = sessionUpdateDto;

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

  /// Update a session
  ///
  /// Update a specific session identified by id.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SessionUpdateDto] sessionUpdateDto (required):
  Future<SessionResponseDto?> updateSession(String id, SessionUpdateDto sessionUpdateDto,) async {
    final response = await updateSessionWithHttpInfo(id, sessionUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SessionResponseDto',) as SessionResponseDto;
    
    }
    return null;
  }
}
