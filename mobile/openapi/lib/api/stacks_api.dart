// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class StacksApi {
  StacksApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion deleteStacksAddedIn = .new(1, 0, 0);

  static const ApiState deleteStacksState = .stable;

  static const ApiVersion searchStacksAddedIn = .new(1, 0, 0);

  static const ApiState searchStacksState = .stable;

  static const ApiVersion createStackAddedIn = .new(1, 0, 0);

  static const ApiState createStackState = .stable;

  static const ApiVersion deleteStackAddedIn = .new(1, 0, 0);

  static const ApiState deleteStackState = .stable;

  static const ApiVersion getStackAddedIn = .new(1, 0, 0);

  static const ApiState getStackState = .stable;

  static const ApiVersion updateStackAddedIn = .new(1, 0, 0);

  static const ApiState updateStackState = .stable;

  static const ApiVersion removeAssetFromStackAddedIn = .new(1, 0, 0);

  static const ApiState removeAssetFromStackState = .stable;

  /// Delete stacks
  ///
  /// Delete multiple stacks by providing a list of stack IDs.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteStacksWithHttpInfo(BulkIdsDto bulkIdsDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/stacks';

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

  /// Delete stacks
  ///
  /// Delete multiple stacks by providing a list of stack IDs.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteStacks(BulkIdsDto bulkIdsDto, {Future<void>? abortTrigger}) async {
    final response = await deleteStacksWithHttpInfo(bulkIdsDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve stacks
  ///
  /// Retrieve a list of stacks.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchStacksWithHttpInfo({String? primaryAssetId, Future<void>? abortTrigger}) async {
    final apiPath = r'/stacks';

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (primaryAssetId != null) {
      queryParams.addAll(_queryParams('', 'primaryAssetId', primaryAssetId));
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

  /// Retrieve stacks
  ///
  /// Retrieve a list of stacks.
  ///
  /// Available since server v1.0.0.
  Future<List<StackResponseDto>> searchStacks({String? primaryAssetId, Future<void>? abortTrigger}) async {
    final response = await searchStacksWithHttpInfo(primaryAssetId: primaryAssetId, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<StackResponseDto>') as List)
          .cast<StackResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create a stack
  ///
  /// Create a new stack by providing a name and a list of asset IDs to include in the stack. If any of the provided asset IDs are primary assets of an existing stack, the existing stack will be merged into the newly created stack.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createStackWithHttpInfo(StackCreateDto stackCreateDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/stacks';

    Object? postBody = stackCreateDto;

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

  /// Create a stack
  ///
  /// Create a new stack by providing a name and a list of asset IDs to include in the stack. If any of the provided asset IDs are primary assets of an existing stack, the existing stack will be merged into the newly created stack.
  ///
  /// Available since server v1.0.0.
  Future<StackResponseDto> createStack(StackCreateDto stackCreateDto, {Future<void>? abortTrigger}) async {
    final response = await createStackWithHttpInfo(stackCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'StackResponseDto')
          as StackResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete a stack
  ///
  /// Delete a specific stack by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteStackWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/stacks/{id}'.replaceAll('{id}', id);

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

  /// Delete a stack
  ///
  /// Delete a specific stack by its ID.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteStack(String id, {Future<void>? abortTrigger}) async {
    final response = await deleteStackWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve a stack
  ///
  /// Retrieve a specific stack by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getStackWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/stacks/{id}'.replaceAll('{id}', id);

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

  /// Retrieve a stack
  ///
  /// Retrieve a specific stack by its ID.
  ///
  /// Available since server v1.0.0.
  Future<StackResponseDto> getStack(String id, {Future<void>? abortTrigger}) async {
    final response = await getStackWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'StackResponseDto')
          as StackResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update a stack
  ///
  /// Update an existing stack by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateStackWithHttpInfo(
    String id,
    StackUpdateDto stackUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/stacks/{id}'.replaceAll('{id}', id);

    Object? postBody = stackUpdateDto;

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

  /// Update a stack
  ///
  /// Update an existing stack by its ID.
  ///
  /// Available since server v1.0.0.
  Future<StackResponseDto> updateStack(String id, StackUpdateDto stackUpdateDto, {Future<void>? abortTrigger}) async {
    final response = await updateStackWithHttpInfo(id, stackUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'StackResponseDto')
          as StackResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Remove an asset from a stack
  ///
  /// Remove a specific asset from a stack by providing the stack ID and asset ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> removeAssetFromStackWithHttpInfo(String assetId, String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/stacks/{id}/assets/{assetId}'.replaceAll('{assetId}', assetId).replaceAll('{id}', id);

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

  /// Remove an asset from a stack
  ///
  /// Remove a specific asset from a stack by providing the stack ID and asset ID.
  ///
  /// Available since server v1.0.0.
  Future<void> removeAssetFromStack(String assetId, String id, {Future<void>? abortTrigger}) async {
    final response = await removeAssetFromStackWithHttpInfo(assetId, id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
