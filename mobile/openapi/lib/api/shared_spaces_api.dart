//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SharedSpacesApi {
  SharedSpacesApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Add assets to a shared space
  ///
  /// Add one or more assets to a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SharedSpaceAssetAddDto] sharedSpaceAssetAddDto (required):
  Future<Response> addAssetsWithHttpInfo(String id, SharedSpaceAssetAddDto sharedSpaceAssetAddDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/assets'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = sharedSpaceAssetAddDto;

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

  /// Add assets to a shared space
  ///
  /// Add one or more assets to a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SharedSpaceAssetAddDto] sharedSpaceAssetAddDto (required):
  Future<void> addAssets(String id, SharedSpaceAssetAddDto sharedSpaceAssetAddDto,) async {
    final response = await addAssetsWithHttpInfo(id, sharedSpaceAssetAddDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Add a member to a shared space
  ///
  /// Add a new member to a shared space with an optional role.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SharedSpaceMemberCreateDto] sharedSpaceMemberCreateDto (required):
  Future<Response> addMemberWithHttpInfo(String id, SharedSpaceMemberCreateDto sharedSpaceMemberCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/members'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = sharedSpaceMemberCreateDto;

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

  /// Add a member to a shared space
  ///
  /// Add a new member to a shared space with an optional role.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SharedSpaceMemberCreateDto] sharedSpaceMemberCreateDto (required):
  Future<SharedSpaceMemberResponseDto?> addMember(String id, SharedSpaceMemberCreateDto sharedSpaceMemberCreateDto,) async {
    final response = await addMemberWithHttpInfo(id, sharedSpaceMemberCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SharedSpaceMemberResponseDto',) as SharedSpaceMemberResponseDto;
    
    }
    return null;
  }

  /// Create a shared space
  ///
  /// Create a new shared space for collaborative asset management.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [SharedSpaceCreateDto] sharedSpaceCreateDto (required):
  Future<Response> createSpaceWithHttpInfo(SharedSpaceCreateDto sharedSpaceCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces';

    // ignore: prefer_final_locals
    Object? postBody = sharedSpaceCreateDto;

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

  /// Create a shared space
  ///
  /// Create a new shared space for collaborative asset management.
  ///
  /// Parameters:
  ///
  /// * [SharedSpaceCreateDto] sharedSpaceCreateDto (required):
  Future<SharedSpaceResponseDto?> createSpace(SharedSpaceCreateDto sharedSpaceCreateDto,) async {
    final response = await createSpaceWithHttpInfo(sharedSpaceCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SharedSpaceResponseDto',) as SharedSpaceResponseDto;
    
    }
    return null;
  }

  /// Delete a person from a shared space
  ///
  /// Permanently delete a person and their face assignments from a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  Future<Response> deleteSpacePersonWithHttpInfo(String id, String personId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/people/{personId}'
      .replaceAll('{id}', id)
      .replaceAll('{personId}', personId);

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

  /// Delete a person from a shared space
  ///
  /// Permanently delete a person and their face assignments from a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  Future<void> deleteSpacePerson(String id, String personId,) async {
    final response = await deleteSpacePersonWithHttpInfo(id, personId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Delete a person alias in a shared space
  ///
  /// Remove a user-specific alias for a person in a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  Future<Response> deleteSpacePersonAliasWithHttpInfo(String id, String personId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/people/{personId}/alias'
      .replaceAll('{id}', id)
      .replaceAll('{personId}', personId);

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

  /// Delete a person alias in a shared space
  ///
  /// Remove a user-specific alias for a person in a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  Future<void> deleteSpacePersonAlias(String id, String personId,) async {
    final response = await deleteSpacePersonAliasWithHttpInfo(id, personId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get all shared spaces
  ///
  /// Retrieve all shared spaces the user is a member of.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAllSpacesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces';

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

  /// Get all shared spaces
  ///
  /// Retrieve all shared spaces the user is a member of.
  Future<List<SharedSpaceResponseDto>?> getAllSpaces() async {
    final response = await getAllSpacesWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<SharedSpaceResponseDto>') as List)
        .cast<SharedSpaceResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Get members of a shared space
  ///
  /// Retrieve all members of a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getMembersWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/members'
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

  /// Get members of a shared space
  ///
  /// Retrieve all members of a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<List<SharedSpaceMemberResponseDto>?> getMembers(String id,) async {
    final response = await getMembersWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<SharedSpaceMemberResponseDto>') as List)
        .cast<SharedSpaceMemberResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Get a shared space
  ///
  /// Retrieve details of a specific shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getSpaceWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}'
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

  /// Get a shared space
  ///
  /// Retrieve details of a specific shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<SharedSpaceResponseDto?> getSpace(String id,) async {
    final response = await getSpaceWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SharedSpaceResponseDto',) as SharedSpaceResponseDto;
    
    }
    return null;
  }

  /// Get space activity feed
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [num] limit:
  ///   Number of items to return
  ///
  /// * [num] offset:
  ///   Number of items to skip
  Future<Response> getSpaceActivitiesWithHttpInfo(String id, { num? limit, num? offset, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/activities'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (limit != null) {
      queryParams.addAll(_queryParams('', 'limit', limit));
    }
    if (offset != null) {
      queryParams.addAll(_queryParams('', 'offset', offset));
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

  /// Get space activity feed
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [num] limit:
  ///   Number of items to return
  ///
  /// * [num] offset:
  ///   Number of items to skip
  Future<List<SharedSpaceActivityResponseDto>?> getSpaceActivities(String id, { num? limit, num? offset, }) async {
    final response = await getSpaceActivitiesWithHttpInfo(id,  limit: limit, offset: offset, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<SharedSpaceActivityResponseDto>') as List)
        .cast<SharedSpaceActivityResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Get map markers for a shared space
  ///
  /// Retrieve map markers for geotagged assets in a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getSpaceMapMarkersWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/map-markers'
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

  /// Get map markers for a shared space
  ///
  /// Retrieve map markers for geotagged assets in a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<List<MapMarkerResponseDto>?> getSpaceMapMarkers(String id,) async {
    final response = await getSpaceMapMarkersWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<MapMarkerResponseDto>') as List)
        .cast<MapMarkerResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Get people in a shared space
  ///
  /// Retrieve all people detected in a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getSpacePeopleWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/people'
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

  /// Get people in a shared space
  ///
  /// Retrieve all people detected in a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<List<SharedSpacePersonResponseDto>?> getSpacePeople(String id,) async {
    final response = await getSpacePeopleWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<SharedSpacePersonResponseDto>') as List)
        .cast<SharedSpacePersonResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Get a person in a shared space
  ///
  /// Retrieve details of a specific person in a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  Future<Response> getSpacePersonWithHttpInfo(String id, String personId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/people/{personId}'
      .replaceAll('{id}', id)
      .replaceAll('{personId}', personId);

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

  /// Get a person in a shared space
  ///
  /// Retrieve details of a specific person in a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  Future<SharedSpacePersonResponseDto?> getSpacePerson(String id, String personId,) async {
    final response = await getSpacePersonWithHttpInfo(id, personId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SharedSpacePersonResponseDto',) as SharedSpacePersonResponseDto;
    
    }
    return null;
  }

  /// Get assets for a person in a shared space
  ///
  /// Retrieve asset IDs for all assets containing a specific person in a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  Future<Response> getSpacePersonAssetsWithHttpInfo(String id, String personId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/people/{personId}/assets'
      .replaceAll('{id}', id)
      .replaceAll('{personId}', personId);

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

  /// Get assets for a person in a shared space
  ///
  /// Retrieve asset IDs for all assets containing a specific person in a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  Future<List<String>?> getSpacePersonAssets(String id, String personId,) async {
    final response = await getSpacePersonAssetsWithHttpInfo(id, personId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<String>') as List)
        .cast<String>()
        .toList(growable: false);

    }
    return null;
  }

  /// Get a space person thumbnail
  ///
  /// Retrieve the thumbnail image for a person in a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  Future<Response> getSpacePersonThumbnailWithHttpInfo(String id, String personId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/people/{personId}/thumbnail'
      .replaceAll('{id}', id)
      .replaceAll('{personId}', personId);

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

  /// Get a space person thumbnail
  ///
  /// Retrieve the thumbnail image for a person in a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  Future<MultipartFile?> getSpacePersonThumbnail(String id, String personId,) async {
    final response = await getSpacePersonThumbnailWithHttpInfo(id, personId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'MultipartFile',) as MultipartFile;
    
    }
    return null;
  }

  /// Mark space as viewed
  ///
  /// Update the last viewed timestamp for the current user in this space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> markSpaceViewedWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/view'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


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

  /// Mark space as viewed
  ///
  /// Update the last viewed timestamp for the current user in this space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> markSpaceViewed(String id,) async {
    final response = await markSpaceViewedWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Merge people in a shared space
  ///
  /// Merge one or more people into the target person in a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  ///
  /// * [SharedSpacePersonMergeDto] sharedSpacePersonMergeDto (required):
  Future<Response> mergeSpacePeopleWithHttpInfo(String id, String personId, SharedSpacePersonMergeDto sharedSpacePersonMergeDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/people/{personId}/merge'
      .replaceAll('{id}', id)
      .replaceAll('{personId}', personId);

    // ignore: prefer_final_locals
    Object? postBody = sharedSpacePersonMergeDto;

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

  /// Merge people in a shared space
  ///
  /// Merge one or more people into the target person in a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  ///
  /// * [SharedSpacePersonMergeDto] sharedSpacePersonMergeDto (required):
  Future<void> mergeSpacePeople(String id, String personId, SharedSpacePersonMergeDto sharedSpacePersonMergeDto,) async {
    final response = await mergeSpacePeopleWithHttpInfo(id, personId, sharedSpacePersonMergeDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Remove assets from a shared space
  ///
  /// Remove one or more assets from a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SharedSpaceAssetRemoveDto] sharedSpaceAssetRemoveDto (required):
  Future<Response> removeAssetsWithHttpInfo(String id, SharedSpaceAssetRemoveDto sharedSpaceAssetRemoveDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/assets'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = sharedSpaceAssetRemoveDto;

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

  /// Remove assets from a shared space
  ///
  /// Remove one or more assets from a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SharedSpaceAssetRemoveDto] sharedSpaceAssetRemoveDto (required):
  Future<void> removeAssets(String id, SharedSpaceAssetRemoveDto sharedSpaceAssetRemoveDto,) async {
    final response = await removeAssetsWithHttpInfo(id, sharedSpaceAssetRemoveDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Remove a member from a shared space
  ///
  /// Remove a member from a shared space, or leave the space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] userId (required):
  Future<Response> removeMemberWithHttpInfo(String id, String userId,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/members/{userId}'
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

  /// Remove a member from a shared space
  ///
  /// Remove a member from a shared space, or leave the space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] userId (required):
  Future<void> removeMember(String id, String userId,) async {
    final response = await removeMemberWithHttpInfo(id, userId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Delete a shared space
  ///
  /// Permanently delete a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> removeSpaceWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}'
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

  /// Delete a shared space
  ///
  /// Permanently delete a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> removeSpace(String id,) async {
    final response = await removeSpaceWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Set a person alias in a shared space
  ///
  /// Set a user-specific alias for a person in a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  ///
  /// * [SharedSpacePersonAliasDto] sharedSpacePersonAliasDto (required):
  Future<Response> setSpacePersonAliasWithHttpInfo(String id, String personId, SharedSpacePersonAliasDto sharedSpacePersonAliasDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/people/{personId}/alias'
      .replaceAll('{id}', id)
      .replaceAll('{personId}', personId);

    // ignore: prefer_final_locals
    Object? postBody = sharedSpacePersonAliasDto;

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

  /// Set a person alias in a shared space
  ///
  /// Set a user-specific alias for a person in a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  ///
  /// * [SharedSpacePersonAliasDto] sharedSpacePersonAliasDto (required):
  Future<void> setSpacePersonAlias(String id, String personId, SharedSpacePersonAliasDto sharedSpacePersonAliasDto,) async {
    final response = await setSpacePersonAliasWithHttpInfo(id, personId, sharedSpacePersonAliasDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Update a member in a shared space
  ///
  /// Update a member's role in a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] userId (required):
  ///
  /// * [SharedSpaceMemberUpdateDto] sharedSpaceMemberUpdateDto (required):
  Future<Response> updateMemberWithHttpInfo(String id, String userId, SharedSpaceMemberUpdateDto sharedSpaceMemberUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/members/{userId}'
      .replaceAll('{id}', id)
      .replaceAll('{userId}', userId);

    // ignore: prefer_final_locals
    Object? postBody = sharedSpaceMemberUpdateDto;

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

  /// Update a member in a shared space
  ///
  /// Update a member's role in a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] userId (required):
  ///
  /// * [SharedSpaceMemberUpdateDto] sharedSpaceMemberUpdateDto (required):
  Future<SharedSpaceMemberResponseDto?> updateMember(String id, String userId, SharedSpaceMemberUpdateDto sharedSpaceMemberUpdateDto,) async {
    final response = await updateMemberWithHttpInfo(id, userId, sharedSpaceMemberUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SharedSpaceMemberResponseDto',) as SharedSpaceMemberResponseDto;
    
    }
    return null;
  }

  /// Update timeline visibility for current member
  ///
  /// Toggle whether this space's assets appear in the current user's personal timeline.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SharedSpaceMemberTimelineDto] sharedSpaceMemberTimelineDto (required):
  Future<Response> updateMemberTimelineWithHttpInfo(String id, SharedSpaceMemberTimelineDto sharedSpaceMemberTimelineDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/members/me/timeline'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = sharedSpaceMemberTimelineDto;

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

  /// Update timeline visibility for current member
  ///
  /// Toggle whether this space's assets appear in the current user's personal timeline.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SharedSpaceMemberTimelineDto] sharedSpaceMemberTimelineDto (required):
  Future<SharedSpaceMemberResponseDto?> updateMemberTimeline(String id, SharedSpaceMemberTimelineDto sharedSpaceMemberTimelineDto,) async {
    final response = await updateMemberTimelineWithHttpInfo(id, sharedSpaceMemberTimelineDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SharedSpaceMemberResponseDto',) as SharedSpaceMemberResponseDto;
    
    }
    return null;
  }

  /// Update a shared space
  ///
  /// Update the name or description of a shared space.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SharedSpaceUpdateDto] sharedSpaceUpdateDto (required):
  Future<Response> updateSpaceWithHttpInfo(String id, SharedSpaceUpdateDto sharedSpaceUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = sharedSpaceUpdateDto;

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

  /// Update a shared space
  ///
  /// Update the name or description of a shared space.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [SharedSpaceUpdateDto] sharedSpaceUpdateDto (required):
  Future<SharedSpaceResponseDto?> updateSpace(String id, SharedSpaceUpdateDto sharedSpaceUpdateDto,) async {
    final response = await updateSpaceWithHttpInfo(id, sharedSpaceUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SharedSpaceResponseDto',) as SharedSpaceResponseDto;
    
    }
    return null;
  }

  /// Update a person in a shared space
  ///
  /// Update the name, visibility, birth date, or representative face of a person.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  ///
  /// * [SharedSpacePersonUpdateDto] sharedSpacePersonUpdateDto (required):
  Future<Response> updateSpacePersonWithHttpInfo(String id, String personId, SharedSpacePersonUpdateDto sharedSpacePersonUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/shared-spaces/{id}/people/{personId}'
      .replaceAll('{id}', id)
      .replaceAll('{personId}', personId);

    // ignore: prefer_final_locals
    Object? postBody = sharedSpacePersonUpdateDto;

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

  /// Update a person in a shared space
  ///
  /// Update the name, visibility, birth date, or representative face of a person.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] personId (required):
  ///
  /// * [SharedSpacePersonUpdateDto] sharedSpacePersonUpdateDto (required):
  Future<SharedSpacePersonResponseDto?> updateSpacePerson(String id, String personId, SharedSpacePersonUpdateDto sharedSpacePersonUpdateDto,) async {
    final response = await updateSpacePersonWithHttpInfo(id, personId, sharedSpacePersonUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'SharedSpacePersonResponseDto',) as SharedSpacePersonResponseDto;
    
    }
    return null;
  }
}
