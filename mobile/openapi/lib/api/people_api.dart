// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class PeopleApi {
  PeopleApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion deletePeopleAddedIn = .new(1, 0, 0);

  static const ApiState deletePeopleState = .stable;

  static const ApiVersion getAllPeopleAddedIn = .new(1, 0, 0);

  static const ApiState getAllPeopleState = .stable;

  static const ApiVersion createPersonAddedIn = .new(1, 0, 0);

  static const ApiState createPersonState = .stable;

  static const ApiVersion updatePeopleAddedIn = .new(1, 0, 0);

  static const ApiState updatePeopleState = .stable;

  static const ApiVersion deletePersonAddedIn = .new(1, 0, 0);

  static const ApiState deletePersonState = .stable;

  static const ApiVersion getPersonAddedIn = .new(1, 0, 0);

  static const ApiState getPersonState = .stable;

  static const ApiVersion updatePersonAddedIn = .new(1, 0, 0);

  static const ApiState updatePersonState = .stable;

  static const ApiVersion mergePersonAddedIn = .new(1, 0, 0);

  static const ApiState mergePersonState = .stable;

  static const ApiVersion reassignFacesAddedIn = .new(1, 0, 0);

  static const ApiState reassignFacesState = .stable;

  static const ApiVersion getPersonStatisticsAddedIn = .new(1, 0, 0);

  static const ApiState getPersonStatisticsState = .stable;

  static const ApiVersion getPersonThumbnailAddedIn = .new(1, 0, 0);

  static const ApiState getPersonThumbnailState = .stable;

  /// Delete people
  ///
  /// Bulk delete a list of people at once.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deletePeopleWithHttpInfo(BulkIdsDto bulkIdsDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/people';

    Object? postBody = bulkIdsDto;

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

  /// Delete people
  ///
  /// Bulk delete a list of people at once.
  ///
  /// Available since server v1.0.0.
  Future<void> deletePeople(BulkIdsDto bulkIdsDto, {Future<void>? abortTrigger}) async {
    final response = await deletePeopleWithHttpInfo(bulkIdsDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get all people
  ///
  /// Retrieve a list of all people.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAllPeopleWithHttpInfo({
    String? closestAssetId,
    String? closestPersonId,
    int? page,
    int? size,
    bool? withHidden,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/people';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (closestAssetId != null) {
      queryParams.addAll(_queryParams('', 'closestAssetId', closestAssetId));
    }
    if (closestPersonId != null) {
      queryParams.addAll(_queryParams('', 'closestPersonId', closestPersonId));
    }
    if (page != null) {
      queryParams.addAll(_queryParams('', 'page', page));
    }
    if (size != null) {
      queryParams.addAll(_queryParams('', 'size', size));
    }
    if (withHidden != null) {
      queryParams.addAll(_queryParams('', 'withHidden', withHidden));
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

  /// Get all people
  ///
  /// Retrieve a list of all people.
  ///
  /// Available since server v1.0.0.
  Future<PeopleResponseDto> getAllPeople({
    String? closestAssetId,
    String? closestPersonId,
    int? page,
    int? size,
    bool? withHidden,
    Future<void>? abortTrigger,
  }) async {
    final response = await getAllPeopleWithHttpInfo(
      closestAssetId: closestAssetId,
      closestPersonId: closestPersonId,
      page: page,
      size: size,
      withHidden: withHidden,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'PeopleResponseDto')
          as PeopleResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create a person
  ///
  /// Create a new person that can have multiple faces assigned to them.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createPersonWithHttpInfo(PersonCreateDto personCreateDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/people';

    Object? postBody = personCreateDto;

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

  /// Create a person
  ///
  /// Create a new person that can have multiple faces assigned to them.
  ///
  /// Available since server v1.0.0.
  Future<PersonResponseDto> createPerson(PersonCreateDto personCreateDto, {Future<void>? abortTrigger}) async {
    final response = await createPersonWithHttpInfo(personCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'PersonResponseDto')
          as PersonResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update people
  ///
  /// Bulk update multiple people at once.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updatePeopleWithHttpInfo(PeopleUpdateDto peopleUpdateDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/people';

    Object? postBody = peopleUpdateDto;

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

  /// Update people
  ///
  /// Bulk update multiple people at once.
  ///
  /// Available since server v1.0.0.
  Future<List<BulkIdResponseDto>> updatePeople(PeopleUpdateDto peopleUpdateDto, {Future<void>? abortTrigger}) async {
    final response = await updatePeopleWithHttpInfo(peopleUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<BulkIdResponseDto>') as List)
          .cast<BulkIdResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete person
  ///
  /// Delete an individual person.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deletePersonWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/people/{id}'.replaceAll('{id}', id);

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

  /// Delete person
  ///
  /// Delete an individual person.
  ///
  /// Available since server v1.0.0.
  Future<void> deletePerson(String id, {Future<void>? abortTrigger}) async {
    final response = await deletePersonWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Get a person
  ///
  /// Retrieve a person by id.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getPersonWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/people/{id}'.replaceAll('{id}', id);

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

  /// Get a person
  ///
  /// Retrieve a person by id.
  ///
  /// Available since server v1.0.0.
  Future<PersonResponseDto> getPerson(String id, {Future<void>? abortTrigger}) async {
    final response = await getPersonWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'PersonResponseDto')
          as PersonResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update person
  ///
  /// Update an individual person.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updatePersonWithHttpInfo(
    String id,
    PersonUpdateDto personUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/people/{id}'.replaceAll('{id}', id);

    Object? postBody = personUpdateDto;

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

  /// Update person
  ///
  /// Update an individual person.
  ///
  /// Available since server v1.0.0.
  Future<PersonResponseDto> updatePerson(
    String id,
    PersonUpdateDto personUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updatePersonWithHttpInfo(id, personUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'PersonResponseDto')
          as PersonResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Merge people
  ///
  /// Merge a list of people into the person specified in the path parameter.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> mergePersonWithHttpInfo(
    String id,
    MergePersonDto mergePersonDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/people/{id}/merge'.replaceAll('{id}', id);

    Object? postBody = mergePersonDto;

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

  /// Merge people
  ///
  /// Merge a list of people into the person specified in the path parameter.
  ///
  /// Available since server v1.0.0.
  Future<List<BulkIdResponseDto>> mergePerson(
    String id,
    MergePersonDto mergePersonDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await mergePersonWithHttpInfo(id, mergePersonDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<BulkIdResponseDto>') as List)
          .cast<BulkIdResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Reassign faces
  ///
  /// Bulk reassign a list of faces to a different person.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> reassignFacesWithHttpInfo(
    String id,
    AssetFaceUpdateDto assetFaceUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/people/{id}/reassign'.replaceAll('{id}', id);

    Object? postBody = assetFaceUpdateDto;

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

  /// Reassign faces
  ///
  /// Bulk reassign a list of faces to a different person.
  ///
  /// Available since server v1.0.0.
  Future<List<PersonResponseDto>> reassignFaces(
    String id,
    AssetFaceUpdateDto assetFaceUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await reassignFacesWithHttpInfo(id, assetFaceUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<PersonResponseDto>') as List)
          .cast<PersonResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get person statistics
  ///
  /// Retrieve statistics about a specific person.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getPersonStatisticsWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/people/{id}/statistics'.replaceAll('{id}', id);

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

  /// Get person statistics
  ///
  /// Retrieve statistics about a specific person.
  ///
  /// Available since server v1.0.0.
  Future<PersonStatisticsResponseDto> getPersonStatistics(String id, {Future<void>? abortTrigger}) async {
    final response = await getPersonStatisticsWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'PersonStatisticsResponseDto')
          as PersonStatisticsResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Get person thumbnail
  ///
  /// Retrieve the thumbnail file for a person.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getPersonThumbnailWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/people/{id}/thumbnail'.replaceAll('{id}', id);

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

  /// Get person thumbnail
  ///
  /// Retrieve the thumbnail file for a person.
  ///
  /// Available since server v1.0.0.
  Future<Uint8List> getPersonThumbnail(String id, {Future<void>? abortTrigger}) async {
    final response = await getPersonThumbnailWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    return response.bodyBytes;
  }
}
