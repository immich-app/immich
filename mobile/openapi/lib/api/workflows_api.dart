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

  /// Create a workflow
  ///
  /// Create a new workflow, the workflow can also be created with empty filters and actions.
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

  /// Create a workflow
  ///
  /// Create a new workflow, the workflow can also be created with empty filters and actions.
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

  /// Delete a workflow
  ///
  /// Delete a workflow by its ID.
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

  /// Delete a workflow
  ///
  /// Delete a workflow by its ID.
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

  /// Retrieve a workflow
  ///
  /// Retrieve information about a specific workflow by its ID.
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

  /// Retrieve a workflow
  ///
  /// Retrieve information about a specific workflow by its ID.
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

  /// Retrieve a workflow
  ///
  /// Retrieve a workflow details without ids, default values, etc.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getWorkflowForShareWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/workflows/{id}/share'
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

  /// Retrieve a workflow
  ///
  /// Retrieve a workflow details without ids, default values, etc.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<WorkflowShareResponseDto?> getWorkflowForShare(String id,) async {
    final response = await getWorkflowForShareWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'WorkflowShareResponseDto',) as WorkflowShareResponseDto;
    
    }
    return null;
  }

  /// List all workflow triggers
  ///
  /// Retrieve a list of all available workflow triggers.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getWorkflowTriggersWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/workflows/triggers';

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

  /// List all workflow triggers
  ///
  /// Retrieve a list of all available workflow triggers.
  Future<List<WorkflowTriggerResponseDto>?> getWorkflowTriggers() async {
    final response = await getWorkflowTriggersWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<WorkflowTriggerResponseDto>') as List)
        .cast<WorkflowTriggerResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// List all workflows
  ///
  /// Retrieve a list of workflows available to the authenticated user.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] description:
  ///   Workflow description
  ///
  /// * [bool] enabled:
  ///   Workflow enabled
  ///
  /// * [String] id:
  ///   Workflow ID
  ///
  /// * [String] name:
  ///   Workflow name
  ///
  /// * [WorkflowTrigger] trigger:
  ///   Workflow trigger type
  Future<Response> searchWorkflowsWithHttpInfo({ String? description, bool? enabled, String? id, String? name, WorkflowTrigger? trigger, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/workflows';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (description != null) {
      queryParams.addAll(_queryParams('', 'description', description));
    }
    if (enabled != null) {
      queryParams.addAll(_queryParams('', 'enabled', enabled));
    }
    if (id != null) {
      queryParams.addAll(_queryParams('', 'id', id));
    }
    if (name != null) {
      queryParams.addAll(_queryParams('', 'name', name));
    }
    if (trigger != null) {
      queryParams.addAll(_queryParams('', 'trigger', trigger));
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

  /// List all workflows
  ///
  /// Retrieve a list of workflows available to the authenticated user.
  ///
  /// Parameters:
  ///
  /// * [String] description:
  ///   Workflow description
  ///
  /// * [bool] enabled:
  ///   Workflow enabled
  ///
  /// * [String] id:
  ///   Workflow ID
  ///
  /// * [String] name:
  ///   Workflow name
  ///
  /// * [WorkflowTrigger] trigger:
  ///   Workflow trigger type
  Future<List<WorkflowResponseDto>?> searchWorkflows({ String? description, bool? enabled, String? id, String? name, WorkflowTrigger? trigger, }) async {
    final response = await searchWorkflowsWithHttpInfo( description: description, enabled: enabled, id: id, name: name, trigger: trigger, );
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

  /// Update a workflow
  ///
  /// Update the information of a specific workflow by its ID. This endpoint can be used to update the workflow name, description, trigger type, filters and actions order, etc.
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

  /// Update a workflow
  ///
  /// Update the information of a specific workflow by its ID. This endpoint can be used to update the workflow name, description, trigger type, filters and actions order, etc.
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
