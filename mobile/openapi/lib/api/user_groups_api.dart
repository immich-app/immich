//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class UserGroupsApi {
  UserGroupsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create a user group
  ///
  /// Create a named group of users for quick selection when sharing.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [UserGroupCreateDto] userGroupCreateDto (required):
  Future<Response> createGroupWithHttpInfo(UserGroupCreateDto userGroupCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/user-groups';

    // ignore: prefer_final_locals
    Object? postBody = userGroupCreateDto;

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

  /// Create a user group
  ///
  /// Create a named group of users for quick selection when sharing.
  ///
  /// Parameters:
  ///
  /// * [UserGroupCreateDto] userGroupCreateDto (required):
  Future<UserGroupResponseDto?> createGroup(UserGroupCreateDto userGroupCreateDto,) async {
    final response = await createGroupWithHttpInfo(userGroupCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserGroupResponseDto',) as UserGroupResponseDto;
    
    }
    return null;
  }

  /// Get all user groups
  ///
  /// Retrieve all user groups created by the current user.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAllGroupsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/user-groups';

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

  /// Get all user groups
  ///
  /// Retrieve all user groups created by the current user.
  Future<List<UserGroupResponseDto>?> getAllGroups() async {
    final response = await getAllGroupsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<UserGroupResponseDto>') as List)
        .cast<UserGroupResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Get a user group
  ///
  /// Retrieve details of a specific user group.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getGroupWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/user-groups/{id}'
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

  /// Get a user group
  ///
  /// Retrieve details of a specific user group.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<UserGroupResponseDto?> getGroup(String id,) async {
    final response = await getGroupWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserGroupResponseDto',) as UserGroupResponseDto;
    
    }
    return null;
  }

  /// Delete a user group
  ///
  /// Permanently delete a user group. Does not affect albums or spaces shared with group members.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> removeGroupWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/user-groups/{id}'
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

  /// Delete a user group
  ///
  /// Permanently delete a user group. Does not affect albums or spaces shared with group members.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> removeGroup(String id,) async {
    final response = await removeGroupWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Set group members
  ///
  /// Replace all members of a user group with the provided list.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UserGroupMemberSetDto] userGroupMemberSetDto (required):
  Future<Response> setMembersWithHttpInfo(String id, UserGroupMemberSetDto userGroupMemberSetDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/user-groups/{id}/members'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = userGroupMemberSetDto;

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

  /// Set group members
  ///
  /// Replace all members of a user group with the provided list.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UserGroupMemberSetDto] userGroupMemberSetDto (required):
  Future<List<UserGroupMemberResponseDto>?> setMembers(String id, UserGroupMemberSetDto userGroupMemberSetDto,) async {
    final response = await setMembersWithHttpInfo(id, userGroupMemberSetDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<UserGroupMemberResponseDto>') as List)
        .cast<UserGroupMemberResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Update a user group
  ///
  /// Update the name or color of a user group.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UserGroupUpdateDto] userGroupUpdateDto (required):
  Future<Response> updateGroupWithHttpInfo(String id, UserGroupUpdateDto userGroupUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/user-groups/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = userGroupUpdateDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      apiPath,
      'PATCH',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Update a user group
  ///
  /// Update the name or color of a user group.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UserGroupUpdateDto] userGroupUpdateDto (required):
  Future<UserGroupResponseDto?> updateGroup(String id, UserGroupUpdateDto userGroupUpdateDto,) async {
    final response = await updateGroupWithHttpInfo(id, userGroupUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'UserGroupResponseDto',) as UserGroupResponseDto;
    
    }
    return null;
  }
}
