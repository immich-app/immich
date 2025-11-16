//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class StacksApi {
  StacksApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create a stack
  ///
  /// Create a new stack by providing a name and a list of asset IDs to include in the stack. If any of the provided asset IDs are primary assets of an existing stack, the existing stack will be merged into the newly created stack.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [StackCreateDto] stackCreateDto (required):
  Future<Response> createStackWithHttpInfo(StackCreateDto stackCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/stacks';

    // ignore: prefer_final_locals
    Object? postBody = stackCreateDto;

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

  /// Create a stack
  ///
  /// Create a new stack by providing a name and a list of asset IDs to include in the stack. If any of the provided asset IDs are primary assets of an existing stack, the existing stack will be merged into the newly created stack.
  ///
  /// Parameters:
  ///
  /// * [StackCreateDto] stackCreateDto (required):
  Future<StackResponseDto?> createStack(StackCreateDto stackCreateDto,) async {
    final response = await createStackWithHttpInfo(stackCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'StackResponseDto',) as StackResponseDto;
    
    }
    return null;
  }

  /// Delete a stack
  ///
  /// Delete a specific stack by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteStackWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/stacks/{id}'
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

  /// Delete a stack
  ///
  /// Delete a specific stack by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteStack(String id,) async {
    final response = await deleteStackWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Delete stacks
  ///
  /// Delete multiple stacks by providing a list of stack IDs.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  Future<Response> deleteStacksWithHttpInfo(BulkIdsDto bulkIdsDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/stacks';

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

  /// Delete stacks
  ///
  /// Delete multiple stacks by providing a list of stack IDs.
  ///
  /// Parameters:
  ///
  /// * [BulkIdsDto] bulkIdsDto (required):
  Future<void> deleteStacks(BulkIdsDto bulkIdsDto,) async {
    final response = await deleteStacksWithHttpInfo(bulkIdsDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve a stack
  ///
  /// Retrieve a specific stack by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getStackWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/stacks/{id}'
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

  /// Retrieve a stack
  ///
  /// Retrieve a specific stack by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<StackResponseDto?> getStack(String id,) async {
    final response = await getStackWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'StackResponseDto',) as StackResponseDto;
    
    }
    return null;
  }

  /// Remove an asset from a stack
  ///
  /// Remove a specific asset from a stack by providing the stack ID and asset ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] assetId (required):
  ///
  /// * [String] id (required):
  Future<Response> removeAssetFromStackWithHttpInfo(String assetId, String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/stacks/{id}/assets/{assetId}'
      .replaceAll('{assetId}', assetId)
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

  /// Remove an asset from a stack
  ///
  /// Remove a specific asset from a stack by providing the stack ID and asset ID.
  ///
  /// Parameters:
  ///
  /// * [String] assetId (required):
  ///
  /// * [String] id (required):
  Future<void> removeAssetFromStack(String assetId, String id,) async {
    final response = await removeAssetFromStackWithHttpInfo(assetId, id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve stacks
  ///
  /// Retrieve a list of stacks.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] primaryAssetId:
  Future<Response> searchStacksWithHttpInfo({ String? primaryAssetId, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/stacks';

    // ignore: prefer_final_locals
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
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Retrieve stacks
  ///
  /// Retrieve a list of stacks.
  ///
  /// Parameters:
  ///
  /// * [String] primaryAssetId:
  Future<List<StackResponseDto>?> searchStacks({ String? primaryAssetId, }) async {
    final response = await searchStacksWithHttpInfo( primaryAssetId: primaryAssetId, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<StackResponseDto>') as List)
        .cast<StackResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Update a stack
  ///
  /// Update an existing stack by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [StackUpdateDto] stackUpdateDto (required):
  Future<Response> updateStackWithHttpInfo(String id, StackUpdateDto stackUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/stacks/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = stackUpdateDto;

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

  /// Update a stack
  ///
  /// Update an existing stack by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [StackUpdateDto] stackUpdateDto (required):
  Future<StackResponseDto?> updateStack(String id, StackUpdateDto stackUpdateDto,) async {
    final response = await updateStackWithHttpInfo(id, stackUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'StackResponseDto',) as StackResponseDto;
    
    }
    return null;
  }
}
