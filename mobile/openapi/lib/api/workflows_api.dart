//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class WorkflowsApi {
  WorkflowsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// This endpoint requires the `workflow.update` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [WorkflowActionCreateDto] workflowActionCreateDto (required):
  Future<Response> addWorkflowActionWithHttpInfo(String id, WorkflowActionCreateDto workflowActionCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/workflows/{id}/actions'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = workflowActionCreateDto;

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

  /// This endpoint requires the `workflow.update` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [WorkflowActionCreateDto] workflowActionCreateDto (required):
  Future<WorkflowActionResponseDto?> addWorkflowAction(String id, WorkflowActionCreateDto workflowActionCreateDto,) async {
    final response = await addWorkflowActionWithHttpInfo(id, workflowActionCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'WorkflowActionResponseDto',) as WorkflowActionResponseDto;
    
    }
    return null;
  }

  /// This endpoint requires the `workflow.update` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [WorkflowFilterCreateDto] workflowFilterCreateDto (required):
  Future<Response> addWorkflowFilterWithHttpInfo(String id, WorkflowFilterCreateDto workflowFilterCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/workflows/{id}/filters'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = workflowFilterCreateDto;

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

  /// This endpoint requires the `workflow.update` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [WorkflowFilterCreateDto] workflowFilterCreateDto (required):
  Future<WorkflowFilterResponseDto?> addWorkflowFilter(String id, WorkflowFilterCreateDto workflowFilterCreateDto,) async {
    final response = await addWorkflowFilterWithHttpInfo(id, workflowFilterCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'WorkflowFilterResponseDto',) as WorkflowFilterResponseDto;
    
    }
    return null;
  }

  /// This endpoint requires the `workflow.create` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [WorkflowCreateDto] workflowCreateDto (required):
  Future<Response> createWorkflowWithHttpInfo(WorkflowCreateDto workflowCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/workflows';

    // ignore: prefer_final_locals
    Object? postBody = workflowCreateDto;

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

  /// This endpoint requires the `workflow.create` permission.
  ///
  /// Parameters:
  ///
  /// * [WorkflowCreateDto] workflowCreateDto (required):
  Future<WorkflowResponseDto?> createWorkflow(WorkflowCreateDto workflowCreateDto,) async {
    final response = await createWorkflowWithHttpInfo(workflowCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'WorkflowResponseDto',) as WorkflowResponseDto;
    
    }
    return null;
  }

  /// This endpoint requires the `workflow.delete` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteWorkflowWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/workflows/{id}'
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

  /// This endpoint requires the `workflow.delete` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteWorkflow(String id,) async {
    final response = await deleteWorkflowWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// This endpoint requires the `workflow.read` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getWorkflowWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/workflows/{id}'
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

  /// This endpoint requires the `workflow.read` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<WorkflowResponseDto?> getWorkflow(String id,) async {
    final response = await getWorkflowWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'WorkflowResponseDto',) as WorkflowResponseDto;
    
    }
    return null;
  }

  /// This endpoint requires the `workflow.read` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getWorkflowsWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/workflows';

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

  /// This endpoint requires the `workflow.read` permission.
  Future<List<WorkflowResponseDto>?> getWorkflows() async {
    final response = await getWorkflowsWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<WorkflowResponseDto>') as List)
        .cast<WorkflowResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// This endpoint requires the `workflow.update` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] actionId (required):
  ///
  /// * [String] id (required):
  Future<Response> removeWorkflowActionWithHttpInfo(String actionId, String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/workflows/{id}/actions/{actionId}'
      .replaceAll('{actionId}', actionId)
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

  /// This endpoint requires the `workflow.update` permission.
  ///
  /// Parameters:
  ///
  /// * [String] actionId (required):
  ///
  /// * [String] id (required):
  Future<void> removeWorkflowAction(String actionId, String id,) async {
    final response = await removeWorkflowActionWithHttpInfo(actionId, id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// This endpoint requires the `workflow.update` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] filterId (required):
  ///
  /// * [String] id (required):
  Future<Response> removeWorkflowFilterWithHttpInfo(String filterId, String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/workflows/{id}/filters/{filterId}'
      .replaceAll('{filterId}', filterId)
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

  /// This endpoint requires the `workflow.update` permission.
  ///
  /// Parameters:
  ///
  /// * [String] filterId (required):
  ///
  /// * [String] id (required):
  Future<void> removeWorkflowFilter(String filterId, String id,) async {
    final response = await removeWorkflowFilterWithHttpInfo(filterId, id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// This endpoint requires the `workflow.update` permission.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [WorkflowUpdateDto] workflowUpdateDto (required):
  Future<Response> updateWorkflowWithHttpInfo(String id, WorkflowUpdateDto workflowUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/workflows/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = workflowUpdateDto;

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

  /// This endpoint requires the `workflow.update` permission.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [WorkflowUpdateDto] workflowUpdateDto (required):
  Future<WorkflowResponseDto?> updateWorkflow(String id, WorkflowUpdateDto workflowUpdateDto,) async {
    final response = await updateWorkflowWithHttpInfo(id, workflowUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'WorkflowResponseDto',) as WorkflowResponseDto;
    
    }
    return null;
  }
}
