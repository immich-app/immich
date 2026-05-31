// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class SharedLinksApi {
  SharedLinksApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getAllSharedLinksAddedIn = .new(1, 0, 0);

  static const ApiState getAllSharedLinksState = .stable;

  static const ApiVersion createSharedLinkAddedIn = .new(1, 0, 0);

  static const ApiState createSharedLinkState = .stable;

  static const ApiVersion sharedLinkLoginAddedIn = .new(2, 6, 0);

  static const ApiState sharedLinkLoginState = .beta;

  static const ApiVersion getMySharedLinkAddedIn = .new(1, 0, 0);

  static const ApiState getMySharedLinkState = .stable;

  static const ApiVersion removeSharedLinkAddedIn = .new(1, 0, 0);

  static const ApiState removeSharedLinkState = .stable;

  static const ApiVersion getSharedLinkByIdAddedIn = .new(1, 0, 0);

  static const ApiState getSharedLinkByIdState = .stable;

  static const ApiVersion updateSharedLinkAddedIn = .new(1, 0, 0);

  static const ApiState updateSharedLinkState = .stable;

  static const ApiVersion removeSharedLinkAssetsAddedIn = .new(1, 0, 0);

  static const ApiState removeSharedLinkAssetsState = .stable;

  static const ApiVersion addSharedLinkAssetsAddedIn = .new(1, 0, 0);

  static const ApiState addSharedLinkAssetsState = .stable;

  /// Retrieve all shared links
  ///
  /// Retrieve a list of all shared links.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAllSharedLinksWithHttpInfo({String? albumId, String? id, Future<void>? abortTrigger}) async {
    final apiPath = r'/shared-links';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (albumId != null) {
      queryParams.addAll(_queryParams('', 'albumId', albumId));
    }
    if (id != null) {
      queryParams.addAll(_queryParams('', 'id', id));
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

  /// Retrieve all shared links
  ///
  /// Retrieve a list of all shared links.
  ///
  /// Available since server v1.0.0.
  Future<List<SharedLinkResponseDto>> getAllSharedLinks({
    String? albumId,
    String? id,
    Future<void>? abortTrigger,
  }) async {
    final response = await getAllSharedLinksWithHttpInfo(albumId: albumId, id: id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<SharedLinkResponseDto>') as List)
          .cast<SharedLinkResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create a shared link
  ///
  /// Create a new shared link.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createSharedLinkWithHttpInfo(
    SharedLinkCreateDto sharedLinkCreateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/shared-links';

    Object? postBody = sharedLinkCreateDto;

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

  /// Create a shared link
  ///
  /// Create a new shared link.
  ///
  /// Available since server v1.0.0.
  Future<SharedLinkResponseDto> createSharedLink(
    SharedLinkCreateDto sharedLinkCreateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await createSharedLinkWithHttpInfo(sharedLinkCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'SharedLinkResponseDto')
          as SharedLinkResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Shared link login
  ///
  /// Login to a password protected shared link
  ///
  /// Available since server v2.6.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> sharedLinkLoginWithHttpInfo(
    SharedLinkLoginDto sharedLinkLoginDto, {
    String? key,
    String? slug,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/shared-links/login';

    Object? postBody = sharedLinkLoginDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
    }

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

  /// Shared link login
  ///
  /// Login to a password protected shared link
  ///
  /// Available since server v2.6.0.
  Future<SharedLinkResponseDto> sharedLinkLogin(
    SharedLinkLoginDto sharedLinkLoginDto, {
    String? key,
    String? slug,
    Future<void>? abortTrigger,
  }) async {
    final response = await sharedLinkLoginWithHttpInfo(
      sharedLinkLoginDto,
      key: key,
      slug: slug,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'SharedLinkResponseDto')
          as SharedLinkResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve current shared link
  ///
  /// Retrieve the current shared link associated with authentication method.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getMySharedLinkWithHttpInfo({String? key, String? slug, Future<void>? abortTrigger}) async {
    final apiPath = r'/shared-links/me';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (key != null) {
      queryParams.addAll(_queryParams('', 'key', key));
    }
    if (slug != null) {
      queryParams.addAll(_queryParams('', 'slug', slug));
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

  /// Retrieve current shared link
  ///
  /// Retrieve the current shared link associated with authentication method.
  ///
  /// Available since server v1.0.0.
  Future<SharedLinkResponseDto> getMySharedLink({String? key, String? slug, Future<void>? abortTrigger}) async {
    final response = await getMySharedLinkWithHttpInfo(key: key, slug: slug, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'SharedLinkResponseDto')
          as SharedLinkResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete a shared link
  ///
  /// Delete a specific shared link by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> removeSharedLinkWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/shared-links/{id}'.replaceAll('{id}', id);

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

  /// Delete a shared link
  ///
  /// Delete a specific shared link by its ID.
  ///
  /// Available since server v1.0.0.
  Future<void> removeSharedLink(String id, {Future<void>? abortTrigger}) async {
    final response = await removeSharedLinkWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve a shared link
  ///
  /// Retrieve a specific shared link by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getSharedLinkByIdWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/shared-links/{id}'.replaceAll('{id}', id);

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

  /// Retrieve a shared link
  ///
  /// Retrieve a specific shared link by its ID.
  ///
  /// Available since server v1.0.0.
  Future<SharedLinkResponseDto> getSharedLinkById(String id, {Future<void>? abortTrigger}) async {
    final response = await getSharedLinkByIdWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'SharedLinkResponseDto')
          as SharedLinkResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update a shared link
  ///
  /// Update an existing shared link by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateSharedLinkWithHttpInfo(
    String id,
    SharedLinkEditDto sharedLinkEditDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/shared-links/{id}'.replaceAll('{id}', id);

    Object? postBody = sharedLinkEditDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

    return apiClient.invokeAPI(
      apiPath,
      r'PATCH',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Update a shared link
  ///
  /// Update an existing shared link by its ID.
  ///
  /// Available since server v1.0.0.
  Future<SharedLinkResponseDto> updateSharedLink(
    String id,
    SharedLinkEditDto sharedLinkEditDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateSharedLinkWithHttpInfo(id, sharedLinkEditDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'SharedLinkResponseDto')
          as SharedLinkResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Remove assets from a shared link
  ///
  /// Remove assets from a specific shared link by its ID. This endpoint is only relevant for shared link of type individual.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> removeSharedLinkAssetsWithHttpInfo(
    String id,
    AssetIdsDto assetIdsDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/shared-links/{id}/assets'.replaceAll('{id}', id);

    Object? postBody = assetIdsDto;

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

  /// Remove assets from a shared link
  ///
  /// Remove assets from a specific shared link by its ID. This endpoint is only relevant for shared link of type individual.
  ///
  /// Available since server v1.0.0.
  Future<List<AssetIdsResponseDto>> removeSharedLinkAssets(
    String id,
    AssetIdsDto assetIdsDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await removeSharedLinkAssetsWithHttpInfo(id, assetIdsDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<AssetIdsResponseDto>') as List)
          .cast<AssetIdsResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Add assets to a shared link
  ///
  /// Add assets to a specific shared link by its ID. This endpoint is only relevant for shared link of type individual.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> addSharedLinkAssetsWithHttpInfo(
    String id,
    AssetIdsDto assetIdsDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/shared-links/{id}/assets'.replaceAll('{id}', id);

    Object? postBody = assetIdsDto;

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

  /// Add assets to a shared link
  ///
  /// Add assets to a specific shared link by its ID. This endpoint is only relevant for shared link of type individual.
  ///
  /// Available since server v1.0.0.
  Future<List<AssetIdsResponseDto>> addSharedLinkAssets(
    String id,
    AssetIdsDto assetIdsDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await addSharedLinkAssetsWithHttpInfo(id, assetIdsDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<AssetIdsResponseDto>') as List)
          .cast<AssetIdsResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
