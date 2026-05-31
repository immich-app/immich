// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class UsersAdminApi {
  UsersAdminApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion searchUsersAdminAddedIn = .new(1, 0, 0);

  static const ApiState searchUsersAdminState = .stable;

  static const ApiVersion createUserAdminAddedIn = .new(1, 0, 0);

  static const ApiState createUserAdminState = .stable;

  static const ApiVersion deleteUserAdminAddedIn = .new(1, 0, 0);

  static const ApiState deleteUserAdminState = .stable;

  static const ApiVersion getUserAdminAddedIn = .new(1, 0, 0);

  static const ApiState getUserAdminState = .stable;

  static const ApiVersion updateUserAdminAddedIn = .new(1, 0, 0);

  static const ApiState updateUserAdminState = .stable;

  static const ApiVersion getUserPreferencesAdminAddedIn = .new(1, 0, 0);

  static const ApiState getUserPreferencesAdminState = .stable;

  static const ApiVersion updateUserPreferencesAdminAddedIn = .new(1, 0, 0);

  static const ApiState updateUserPreferencesAdminState = .stable;

  static const ApiVersion restoreUserAdminAddedIn = .new(1, 0, 0);

  static const ApiState restoreUserAdminState = .stable;

  static const ApiVersion getUserSessionsAdminAddedIn = .new(1, 0, 0);

  static const ApiState getUserSessionsAdminState = .stable;

  static const ApiVersion getUserStatisticsAdminAddedIn = .new(1, 0, 0);

  static const ApiState getUserStatisticsAdminState = .stable;

  /// Search users
  ///
  /// Search for users.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchUsersAdminWithHttpInfo({String? id, bool? withDeleted, Future<void>? abortTrigger}) async {
    final apiPath = r'/admin/users';

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
      r'GET',
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
  /// Available since server v1.0.0.
  Future<List<UserAdminResponseDto>> searchUsersAdmin({
    String? id,
    bool? withDeleted,
    Future<void>? abortTrigger,
  }) async {
    final response = await searchUsersAdminWithHttpInfo(id: id, withDeleted: withDeleted, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<UserAdminResponseDto>') as List)
          .cast<UserAdminResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create a user
  ///
  /// Create a new user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createUserAdminWithHttpInfo(
    UserAdminCreateDto userAdminCreateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/admin/users';

    Object? postBody = userAdminCreateDto;

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

  /// Create a user
  ///
  /// Create a new user.
  ///
  /// Available since server v1.0.0.
  Future<UserAdminResponseDto> createUserAdmin(
    UserAdminCreateDto userAdminCreateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await createUserAdminWithHttpInfo(userAdminCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserAdminResponseDto')
          as UserAdminResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete a user
  ///
  /// Delete a user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteUserAdminWithHttpInfo(
    String id,
    UserAdminDeleteDto userAdminDeleteDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/admin/users/{id}'.replaceAll('{id}', id);

    Object? postBody = userAdminDeleteDto;

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

  /// Delete a user
  ///
  /// Delete a user.
  ///
  /// Available since server v1.0.0.
  Future<UserAdminResponseDto> deleteUserAdmin(
    String id,
    UserAdminDeleteDto userAdminDeleteDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await deleteUserAdminWithHttpInfo(id, userAdminDeleteDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserAdminResponseDto')
          as UserAdminResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve a user
  ///
  /// Retrieve  a specific user by their ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getUserAdminWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/admin/users/{id}'.replaceAll('{id}', id);

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

  /// Retrieve a user
  ///
  /// Retrieve  a specific user by their ID.
  ///
  /// Available since server v1.0.0.
  Future<UserAdminResponseDto> getUserAdmin(String id, {Future<void>? abortTrigger}) async {
    final response = await getUserAdminWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserAdminResponseDto')
          as UserAdminResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update a user
  ///
  /// Update an existing user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateUserAdminWithHttpInfo(
    String id,
    UserAdminUpdateDto userAdminUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/admin/users/{id}'.replaceAll('{id}', id);

    Object? postBody = userAdminUpdateDto;

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

  /// Update a user
  ///
  /// Update an existing user.
  ///
  /// Available since server v1.0.0.
  Future<UserAdminResponseDto> updateUserAdmin(
    String id,
    UserAdminUpdateDto userAdminUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateUserAdminWithHttpInfo(id, userAdminUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserAdminResponseDto')
          as UserAdminResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve user preferences
  ///
  /// Retrieve the preferences of a specific user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getUserPreferencesAdminWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/admin/users/{id}/preferences'.replaceAll('{id}', id);

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

  /// Retrieve user preferences
  ///
  /// Retrieve the preferences of a specific user.
  ///
  /// Available since server v1.0.0.
  Future<UserPreferencesResponseDto> getUserPreferencesAdmin(String id, {Future<void>? abortTrigger}) async {
    final response = await getUserPreferencesAdminWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserPreferencesResponseDto')
          as UserPreferencesResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update user preferences
  ///
  /// Update the preferences of a specific user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateUserPreferencesAdminWithHttpInfo(
    String id,
    UserPreferencesUpdateDto userPreferencesUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/admin/users/{id}/preferences'.replaceAll('{id}', id);

    Object? postBody = userPreferencesUpdateDto;

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

  /// Update user preferences
  ///
  /// Update the preferences of a specific user.
  ///
  /// Available since server v1.0.0.
  Future<UserPreferencesResponseDto> updateUserPreferencesAdmin(
    String id,
    UserPreferencesUpdateDto userPreferencesUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateUserPreferencesAdminWithHttpInfo(
      id,
      userPreferencesUpdateDto,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserPreferencesResponseDto')
          as UserPreferencesResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Restore a deleted user
  ///
  /// Restore a previously deleted user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> restoreUserAdminWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/admin/users/{id}/restore'.replaceAll('{id}', id);

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

  /// Restore a deleted user
  ///
  /// Restore a previously deleted user.
  ///
  /// Available since server v1.0.0.
  Future<UserAdminResponseDto> restoreUserAdmin(String id, {Future<void>? abortTrigger}) async {
    final response = await restoreUserAdminWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'UserAdminResponseDto')
          as UserAdminResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve user sessions
  ///
  /// Retrieve all sessions for a specific user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getUserSessionsAdminWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/admin/users/{id}/sessions'.replaceAll('{id}', id);

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

  /// Retrieve user sessions
  ///
  /// Retrieve all sessions for a specific user.
  ///
  /// Available since server v1.0.0.
  Future<List<SessionResponseDto>> getUserSessionsAdmin(String id, {Future<void>? abortTrigger}) async {
    final response = await getUserSessionsAdminWithHttpInfo(id, abortTrigger: abortTrigger);
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

  /// Retrieve user statistics
  ///
  /// Retrieve asset statistics for a specific user.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getUserStatisticsAdminWithHttpInfo(
    String id, {
    bool? isFavorite,
    bool? isTrashed,
    AssetVisibility? visibility,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/admin/users/{id}/statistics'.replaceAll('{id}', id);

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
      r'GET',
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
  /// Available since server v1.0.0.
  Future<AssetStatsResponseDto> getUserStatisticsAdmin(
    String id, {
    bool? isFavorite,
    bool? isTrashed,
    AssetVisibility? visibility,
    Future<void>? abortTrigger,
  }) async {
    final response = await getUserStatisticsAdminWithHttpInfo(
      id,
      isFavorite: isFavorite,
      isTrashed: isTrashed,
      visibility: visibility,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'AssetStatsResponseDto')
          as AssetStatsResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
