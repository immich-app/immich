//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class UsersAdminApi {
  UsersAdminApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create a user
  ///
  /// Create a new user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [UserAdminCreateDto] userAdminCreateDto (required):
  Future<Response> createUserAdminWithHttpInfo(UserAdminCreateDto userAdminCreateDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/users';

    // ignore: prefer_final_locals
    Object? postBody = userAdminCreateDto;

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
      abortTrigger: abortTrigger,
    );
  }

  /// Create a user
  ///
  /// Create a new user.
  ///
  /// Parameters:
  ///
  /// * [UserAdminCreateDto] userAdminCreateDto (required):
  Future<UserAdminResponseDto?> createUserAdmin(UserAdminCreateDto userAdminCreateDto, { Future<void>? abortTrigger, }) async {
    final response = await createUserAdminWithHttpInfo(userAdminCreateDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserAdminResponseDto',) as UserAdminResponseDto;
    
    }
    return null;
  }

  /// Delete a user
  ///
  /// Delete a user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UserAdminDeleteDto] userAdminDeleteDto (required):
  Future<Response> deleteUserAdminWithHttpInfo(String id, UserAdminDeleteDto userAdminDeleteDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/users/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = userAdminDeleteDto;

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
      abortTrigger: abortTrigger,
    );
  }

  /// Delete a user
  ///
  /// Delete a user.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UserAdminDeleteDto] userAdminDeleteDto (required):
  Future<UserAdminResponseDto?> deleteUserAdmin(String id, UserAdminDeleteDto userAdminDeleteDto, { Future<void>? abortTrigger, }) async {
    final response = await deleteUserAdminWithHttpInfo(id, userAdminDeleteDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserAdminResponseDto',) as UserAdminResponseDto;
    
    }
    return null;
  }

  /// Retrieve a user
  ///
  /// Retrieve  a specific user by their ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getUserAdminWithHttpInfo(String id, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/users/{id}'
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
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve a user
  ///
  /// Retrieve  a specific user by their ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<UserAdminResponseDto?> getUserAdmin(String id, { Future<void>? abortTrigger, }) async {
    final response = await getUserAdminWithHttpInfo(id, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserAdminResponseDto',) as UserAdminResponseDto;
    
    }
    return null;
  }

  /// Retrieve calendar heatmap activity
  ///
  /// Retrieve activity counts for a specified period, in a calendar heatmap format.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [DateTime] from:
  ///   Start date in UTC
  ///
  /// * [DateTime] to:
  ///   End date in UTC
  ///
  /// * [CalendarHeatmapType] type:
  Future<Response> getUserCalendarHeatmapAdminWithHttpInfo(String id, { DateTime? from, DateTime? to, CalendarHeatmapType? type, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/users/{id}/calendar-heatmap'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (from != null) {
      queryParams.addAll(_queryParams('', 'from', from));
    }
    if (to != null) {
      queryParams.addAll(_queryParams('', 'to', to));
    }
    if (type != null) {
      queryParams.addAll(_queryParams('', 'type', type));
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
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve calendar heatmap activity
  ///
  /// Retrieve activity counts for a specified period, in a calendar heatmap format.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [DateTime] from:
  ///   Start date in UTC
  ///
  /// * [DateTime] to:
  ///   End date in UTC
  ///
  /// * [CalendarHeatmapType] type:
  Future<CalendarHeatmapResponseDto?> getUserCalendarHeatmapAdmin(String id, { DateTime? from, DateTime? to, CalendarHeatmapType? type, Future<void>? abortTrigger, }) async {
    final response = await getUserCalendarHeatmapAdminWithHttpInfo(id, from: from, to: to, type: type, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'CalendarHeatmapResponseDto',) as CalendarHeatmapResponseDto;
    
    }
    return null;
  }

  /// Retrieve user preferences
  ///
  /// Retrieve the preferences of a specific user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getUserPreferencesAdminWithHttpInfo(String id, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/users/{id}/preferences'
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
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve user preferences
  ///
  /// Retrieve the preferences of a specific user.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<UserPreferencesResponseDto?> getUserPreferencesAdmin(String id, { Future<void>? abortTrigger, }) async {
    final response = await getUserPreferencesAdminWithHttpInfo(id, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserPreferencesResponseDto',) as UserPreferencesResponseDto;
    
    }
    return null;
  }

  /// Retrieve user sessions
  ///
  /// Retrieve all sessions for a specific user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getUserSessionsAdminWithHttpInfo(String id, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/users/{id}/sessions'
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
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve user sessions
  ///
  /// Retrieve all sessions for a specific user.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<List<SessionResponseDto>?> getUserSessionsAdmin(String id, { Future<void>? abortTrigger, }) async {
    final response = await getUserSessionsAdminWithHttpInfo(id, abortTrigger: abortTrigger,);
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

  /// Retrieve user statistics
  ///
  /// Retrieve asset statistics for a specific user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status
  ///
  /// * [bool] isTrashed:
  ///   Filter by trash status
  ///
  /// * [AssetVisibility] visibility:
  Future<Response> getUserStatisticsAdminWithHttpInfo(String id, { bool? isFavorite, bool? isTrashed, AssetVisibility? visibility, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/users/{id}/statistics'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (isFavorite != null) {
      queryParams.addAll(_queryParams('', 'isFavorite', isFavorite));
    }
    if (isTrashed != null) {
      queryParams.addAll(_queryParams('', 'isTrashed', isTrashed));
    }
    if (visibility != null) {
      queryParams.addAll(_queryParams('', 'visibility', visibility));
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
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve user statistics
  ///
  /// Retrieve asset statistics for a specific user.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [bool] isFavorite:
  ///   Filter by favorite status
  ///
  /// * [bool] isTrashed:
  ///   Filter by trash status
  ///
  /// * [AssetVisibility] visibility:
  Future<AssetStatsResponseDto?> getUserStatisticsAdmin(String id, { bool? isFavorite, bool? isTrashed, AssetVisibility? visibility, Future<void>? abortTrigger, }) async {
    final response = await getUserStatisticsAdminWithHttpInfo(id, isFavorite: isFavorite, isTrashed: isTrashed, visibility: visibility, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetStatsResponseDto',) as AssetStatsResponseDto;
    
    }
    return null;
  }

  /// Restore a deleted user
  ///
  /// Restore a previously deleted user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> restoreUserAdminWithHttpInfo(String id, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/users/{id}/restore'
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
      abortTrigger: abortTrigger,
    );
  }

  /// Restore a deleted user
  ///
  /// Restore a previously deleted user.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<UserAdminResponseDto?> restoreUserAdmin(String id, { Future<void>? abortTrigger, }) async {
    final response = await restoreUserAdminWithHttpInfo(id, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserAdminResponseDto',) as UserAdminResponseDto;
    
    }
    return null;
  }

  /// Search users
  ///
  /// Search for users.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id:
  ///   User ID filter
  ///
  /// * [bool] withDeleted:
  ///   Include deleted users
  Future<Response> searchUsersAdminWithHttpInfo({ String? id, bool? withDeleted, Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/users';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (id != null) {
      queryParams.addAll(_queryParams('', 'id', id));
    }
    if (withDeleted != null) {
      queryParams.addAll(_queryParams('', 'withDeleted', withDeleted));
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
      abortTrigger: abortTrigger,
    );
  }

  /// Search users
  ///
  /// Search for users.
  ///
  /// Parameters:
  ///
  /// * [String] id:
  ///   User ID filter
  ///
  /// * [bool] withDeleted:
  ///   Include deleted users
  Future<List<UserAdminResponseDto>?> searchUsersAdmin({ String? id, bool? withDeleted, Future<void>? abortTrigger, }) async {
    final response = await searchUsersAdminWithHttpInfo(id: id, withDeleted: withDeleted, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<UserAdminResponseDto>') as List)
        .cast<UserAdminResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Update a user
  ///
  /// Update an existing user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UserAdminUpdateDto] userAdminUpdateDto (required):
  Future<Response> updateUserAdminWithHttpInfo(String id, UserAdminUpdateDto userAdminUpdateDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/users/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = userAdminUpdateDto;

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
      abortTrigger: abortTrigger,
    );
  }

  /// Update a user
  ///
  /// Update an existing user.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UserAdminUpdateDto] userAdminUpdateDto (required):
  Future<UserAdminResponseDto?> updateUserAdmin(String id, UserAdminUpdateDto userAdminUpdateDto, { Future<void>? abortTrigger, }) async {
    final response = await updateUserAdminWithHttpInfo(id, userAdminUpdateDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserAdminResponseDto',) as UserAdminResponseDto;
    
    }
    return null;
  }

  /// Update user preferences
  ///
  /// Update the preferences of a specific user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UserPreferencesUpdateDto] userPreferencesUpdateDto (required):
  Future<Response> updateUserPreferencesAdminWithHttpInfo(String id, UserPreferencesUpdateDto userPreferencesUpdateDto, { Future<void>? abortTrigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/users/{id}/preferences'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = userPreferencesUpdateDto;

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
      abortTrigger: abortTrigger,
    );
  }

  /// Update user preferences
  ///
  /// Update the preferences of a specific user.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UserPreferencesUpdateDto] userPreferencesUpdateDto (required):
  Future<UserPreferencesResponseDto?> updateUserPreferencesAdmin(String id, UserPreferencesUpdateDto userPreferencesUpdateDto, { Future<void>? abortTrigger, }) async {
    final response = await updateUserPreferencesAdminWithHttpInfo(id, userPreferencesUpdateDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserPreferencesResponseDto',) as UserPreferencesResponseDto;
    
    }
    return null;
  }
}
