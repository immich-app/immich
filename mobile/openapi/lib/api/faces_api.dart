// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class FacesApi {
  FacesApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getFacesAddedIn = .new(1, 0, 0);

  static const ApiState getFacesState = .stable;

  static const ApiVersion createFaceAddedIn = .new(1, 0, 0);

  static const ApiState createFaceState = .stable;

  static const ApiVersion deleteFaceAddedIn = .new(1, 0, 0);

  static const ApiState deleteFaceState = .stable;

  static const ApiVersion reassignFacesByIdAddedIn = .new(1, 0, 0);

  static const ApiState reassignFacesByIdState = .stable;

  /// Retrieve faces for asset
  ///
  /// Retrieve all faces belonging to an asset.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getFacesWithHttpInfo({required String id, Future<void>? abortTrigger}) async {
    final apiPath = r'/faces';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    queryParams.addAll(_queryParams('', 'id', id));

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

  /// Retrieve faces for asset
  ///
  /// Retrieve all faces belonging to an asset.
  ///
  /// Available since server v1.0.0.
  Future<List<AssetFaceResponseDto>> getFaces({required String id, Future<void>? abortTrigger}) async {
    final response = await getFacesWithHttpInfo(id: id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<AssetFaceResponseDto>') as List)
          .cast<AssetFaceResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create a face
  ///
  /// Create a new face that has not been discovered by facial recognition. The content of the bounding box is considered a face.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createFaceWithHttpInfo(AssetFaceCreateDto assetFaceCreateDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/faces';

    Object? postBody = assetFaceCreateDto;

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

  /// Create a face
  ///
  /// Create a new face that has not been discovered by facial recognition. The content of the bounding box is considered a face.
  ///
  /// Available since server v1.0.0.
  Future<void> createFace(AssetFaceCreateDto assetFaceCreateDto, {Future<void>? abortTrigger}) async {
    final response = await createFaceWithHttpInfo(assetFaceCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Delete a face
  ///
  /// Delete a face identified by the id. Optionally can be force deleted.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteFaceWithHttpInfo(
    String id,
    AssetFaceDeleteDto assetFaceDeleteDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/faces/{id}'.replaceAll('{id}', id);

    Object? postBody = assetFaceDeleteDto;

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

  /// Delete a face
  ///
  /// Delete a face identified by the id. Optionally can be force deleted.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteFace(String id, AssetFaceDeleteDto assetFaceDeleteDto, {Future<void>? abortTrigger}) async {
    final response = await deleteFaceWithHttpInfo(id, assetFaceDeleteDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Re-assign a face to another person
  ///
  /// Re-assign the face provided in the body to the person identified by the id in the path parameter.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> reassignFacesByIdWithHttpInfo(String id, FaceDto faceDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/faces/{id}'.replaceAll('{id}', id);

    Object? postBody = faceDto;

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

  /// Re-assign a face to another person
  ///
  /// Re-assign the face provided in the body to the person identified by the id in the path parameter.
  ///
  /// Available since server v1.0.0.
  Future<PersonResponseDto> reassignFacesById(String id, FaceDto faceDto, {Future<void>? abortTrigger}) async {
    final response = await reassignFacesByIdWithHttpInfo(id, faceDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'PersonResponseDto')
          as PersonResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
