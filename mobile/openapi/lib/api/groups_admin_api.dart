//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class GroupsAdminApi {
  GroupsAdminApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// This endpoint is an admin-only route, and requires the `adminGroupUser.create` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [GroupUserCreateAllDto] groupUserCreateAllDto (required):
  Future<Response> addUsersToGroupAdminWithHttpInfo(String id, GroupUserCreateAllDto groupUserCreateAllDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/groups/{id}/users'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = groupUserCreateAllDto;

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

  /// This endpoint is an admin-only route, and requires the `adminGroupUser.create` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [GroupUserCreateAllDto] groupUserCreateAllDto (required):
  Future<List<GroupUserResponseDto>?> addUsersToGroupAdmin(String id, GroupUserCreateAllDto groupUserCreateAllDto,) async {
    final response = await addUsersToGroupAdminWithHttpInfo(id, groupUserCreateAllDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<GroupUserResponseDto>') as List)
        .cast<GroupUserResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// This endpoint is an admin-only route, and requires the `adminGroup.create` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [GroupAdminCreateDto] groupAdminCreateDto (required):
  Future<Response> createGroupAdminWithHttpInfo(GroupAdminCreateDto groupAdminCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/groups';

    // ignore: prefer_final_locals
    Object? postBody = groupAdminCreateDto;

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

  /// This endpoint is an admin-only route, and requires the `adminGroup.create` permission.
  ///
  /// Parameters:
  ///
  /// * [GroupAdminCreateDto] groupAdminCreateDto (required):
  Future<GroupAdminResponseDto?> createGroupAdmin(GroupAdminCreateDto groupAdminCreateDto,) async {
    final response = await createGroupAdminWithHttpInfo(groupAdminCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'GroupAdminResponseDto',) as GroupAdminResponseDto;
    
    }
    return null;
  }

  /// This endpoint is an admin-only route, and requires the `adminGroup.delete` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteGroupAdminWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/groups/{id}'
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

  /// This endpoint is an admin-only route, and requires the `adminGroup.delete` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteGroupAdmin(String id,) async {
    final response = await deleteGroupAdminWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// This endpoint is an admin-only route, and requires the `adminGroup.read` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getGroupAdminWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/groups/{id}'
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

  /// This endpoint is an admin-only route, and requires the `adminGroup.read` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<GroupAdminResponseDto?> getGroupAdmin(String id,) async {
    final response = await getGroupAdminWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'GroupAdminResponseDto',) as GroupAdminResponseDto;
    
    }
    return null;
  }

  /// This endpoint is an admin-only route, and requires the `adminGroupUser.read` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getUsersForGroupAdminWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/groups/{id}/users'
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

  /// This endpoint is an admin-only route, and requires the `adminGroupUser.read` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<List<GroupUserResponseDto>?> getUsersForGroupAdmin(String id,) async {
    final response = await getUsersForGroupAdminWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<GroupUserResponseDto>') as List)
        .cast<GroupUserResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// This endpoint requires the `adminGroupUser.delete` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] userId (required):
  Future<Response> removeUserFromGroupAdminWithHttpInfo(String id, String userId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/groups/{id}/user/{userId}'
      .replaceAll('{id}', id)
      .replaceAll('{userId}', userId);

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

  /// This endpoint requires the `adminGroupUser.delete` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] userId (required):
  Future<void> removeUserFromGroupAdmin(String id, String userId,) async {
    final response = await removeUserFromGroupAdminWithHttpInfo(id, userId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// This endpoint requires the `adminGroupUser.delete` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [GroupUserDeleteAllDto] groupUserDeleteAllDto (required):
  Future<Response> removeUsersFromGroupAdminWithHttpInfo(String id, GroupUserDeleteAllDto groupUserDeleteAllDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/groups/{id}/user'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = groupUserDeleteAllDto;

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

  /// This endpoint requires the `adminGroupUser.delete` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [GroupUserDeleteAllDto] groupUserDeleteAllDto (required):
  Future<void> removeUsersFromGroupAdmin(String id, GroupUserDeleteAllDto groupUserDeleteAllDto,) async {
    final response = await removeUsersFromGroupAdminWithHttpInfo(id, groupUserDeleteAllDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// This endpoint is an admin-only route, and requires the `adminGroup.read` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id:
  ///
  /// * [String] userId:
  Future<Response> searchGroupsAdminWithHttpInfo({ String? id, String? userId, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/groups';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (id != null) {
      queryParams.addAll(_queryParams('', 'id', id));
    }
    if (userId != null) {
      queryParams.addAll(_queryParams('', 'userId', userId));
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

  /// This endpoint is an admin-only route, and requires the `adminGroup.read` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id:
  ///
  /// * [String] userId:
  Future<List<GroupAdminResponseDto>?> searchGroupsAdmin({ String? id, String? userId, }) async {
    final response = await searchGroupsAdminWithHttpInfo( id: id, userId: userId, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<GroupAdminResponseDto>') as List)
        .cast<GroupAdminResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// This endpoint is an admin-only route, and requires the `adminGroup.update` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [GroupAdminUpdateDto] groupAdminUpdateDto (required):
  Future<Response> updateGroupAdminWithHttpInfo(String id, GroupAdminUpdateDto groupAdminUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/admin/groups/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = groupAdminUpdateDto;

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

  /// This endpoint is an admin-only route, and requires the `adminGroup.update` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [GroupAdminUpdateDto] groupAdminUpdateDto (required):
  Future<GroupAdminResponseDto?> updateGroupAdmin(String id, GroupAdminUpdateDto groupAdminUpdateDto,) async {
    final response = await updateGroupAdminWithHttpInfo(id, groupAdminUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'GroupAdminResponseDto',) as GroupAdminResponseDto;
    
    }
    return null;
  }
}
