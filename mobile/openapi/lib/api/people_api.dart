//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class PeopleApi {
  PeopleApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// This endpoint requires the `person.create` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [PersonCreateDto] personCreateDto (required):
  Future<Response> createPersonWithHttpInfo(PersonCreateDto personCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/people';

    // ignore: prefer_final_locals
    Object? postBody = personCreateDto;

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

  /// This endpoint requires the `person.create` permission.
  ///
  /// Parameters:
  ///
  /// * [PersonCreateDto] personCreateDto (required):
  Future<PersonResponseDto?> createPerson(PersonCreateDto personCreateDto,) async {
    final response = await createPersonWithHttpInfo(personCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PersonResponseDto',) as PersonResponseDto;
    
    }
    return null;
  }

  /// This endpoint requires the `person.delete` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  Future<Response> deletePeopleWithHttpInfo(BulkIdsDto bulkIdsDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/people';

    // ignore: prefer_final_locals
    Object? postBody = bulkIdsDto;

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

  /// This endpoint requires the `person.delete` permission.
  ///
  /// Parameters:
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  Future<void> deletePeople(BulkIdsDto bulkIdsDto,) async {
    final response = await deletePeopleWithHttpInfo(bulkIdsDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// This endpoint requires the `person.delete` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deletePersonWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/people/{id}'
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

  /// This endpoint requires the `person.delete` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deletePerson(String id,) async {
    final response = await deletePersonWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// This endpoint requires the `person.read` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] closestAssetId:
  ///
  /// * [String] closestPersonId:
  ///
  /// * [num] page:
  ///   Page number for pagination
  ///
  /// * [num] size:
  ///   Number of items per page
  ///
  /// * [bool] withHidden:
  Future<Response> getAllPeopleWithHttpInfo({ String? closestAssetId, String? closestPersonId, num? page, num? size, bool? withHidden, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/people';

    // ignore: prefer_final_locals
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
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// This endpoint requires the `person.read` permission.
  ///
  /// Parameters:
  ///
  /// * [String] closestAssetId:
  ///
  /// * [String] closestPersonId:
  ///
  /// * [num] page:
  ///   Page number for pagination
  ///
  /// * [num] size:
  ///   Number of items per page
  ///
  /// * [bool] withHidden:
  Future<PeopleResponseDto?> getAllPeople({ String? closestAssetId, String? closestPersonId, num? page, num? size, bool? withHidden, }) async {
    final response = await getAllPeopleWithHttpInfo( closestAssetId: closestAssetId, closestPersonId: closestPersonId, page: page, size: size, withHidden: withHidden, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PeopleResponseDto',) as PeopleResponseDto;
    
    }
    return null;
  }

  /// This endpoint requires the `person.read` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getPersonWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/people/{id}'
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

  /// This endpoint requires the `person.read` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<PersonResponseDto?> getPerson(String id,) async {
    final response = await getPersonWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PersonResponseDto',) as PersonResponseDto;
    
    }
    return null;
  }

  /// This endpoint requires the `person.statistics` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getPersonStatisticsWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/people/{id}/statistics'
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

  /// This endpoint requires the `person.statistics` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<PersonStatisticsResponseDto?> getPersonStatistics(String id,) async {
    final response = await getPersonStatisticsWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PersonStatisticsResponseDto',) as PersonStatisticsResponseDto;
    
    }
    return null;
  }

  /// This endpoint requires the `person.read` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getPersonThumbnailWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/people/{id}/thumbnail'
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

  /// This endpoint requires the `person.read` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<MultipartFile?> getPersonThumbnail(String id,) async {
    final response = await getPersonThumbnailWithHttpInfo(id,);
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

  /// This endpoint requires the `person.merge` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [MergePersonDto] mergePersonDto (required):
  Future<Response> mergePersonWithHttpInfo(String id, MergePersonDto mergePersonDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/people/{id}/merge'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = mergePersonDto;

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

  /// This endpoint requires the `person.merge` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [MergePersonDto] mergePersonDto (required):
  Future<List<BulkIdResponseDto>?> mergePerson(String id, MergePersonDto mergePersonDto,) async {
    final response = await mergePersonWithHttpInfo(id, mergePersonDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<BulkIdResponseDto>') as List)
        .cast<BulkIdResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// This endpoint requires the `person.reassign` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AssetFaceUpdateDto] assetFaceUpdateDto (required):
  Future<Response> reassignFacesWithHttpInfo(String id, AssetFaceUpdateDto assetFaceUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/people/{id}/reassign'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = assetFaceUpdateDto;

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

  /// This endpoint requires the `person.reassign` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [AssetFaceUpdateDto] assetFaceUpdateDto (required):
  Future<List<PersonResponseDto>?> reassignFaces(String id, AssetFaceUpdateDto assetFaceUpdateDto,) async {
    final response = await reassignFacesWithHttpInfo(id, assetFaceUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<PersonResponseDto>') as List)
        .cast<PersonResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// This endpoint requires the `person.update` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [PeopleUpdateDto] peopleUpdateDto (required):
  Future<Response> updatePeopleWithHttpInfo(PeopleUpdateDto peopleUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/people';

    // ignore: prefer_final_locals
    Object? postBody = peopleUpdateDto;

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

  /// This endpoint requires the `person.update` permission.
  ///
  /// Parameters:
  ///
  /// * [PeopleUpdateDto] peopleUpdateDto (required):
  Future<List<BulkIdResponseDto>?> updatePeople(PeopleUpdateDto peopleUpdateDto,) async {
    final response = await updatePeopleWithHttpInfo(peopleUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<BulkIdResponseDto>') as List)
        .cast<BulkIdResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// This endpoint requires the `person.update` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [PersonUpdateDto] personUpdateDto (required):
  Future<Response> updatePersonWithHttpInfo(String id, PersonUpdateDto personUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/people/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = personUpdateDto;

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

  /// This endpoint requires the `person.update` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [PersonUpdateDto] personUpdateDto (required):
  Future<PersonResponseDto?> updatePerson(String id, PersonUpdateDto personUpdateDto,) async {
    final response = await updatePersonWithHttpInfo(id, personUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'PersonResponseDto',) as PersonResponseDto;
    
    }
    return null;
  }
}
