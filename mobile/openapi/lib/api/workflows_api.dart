// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class WorkflowsApi {
  WorkflowsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion searchWorkflowsAddedIn = .new(3, 0, 0);

  static const ApiState searchWorkflowsState = .added;

  static const ApiVersion createWorkflowAddedIn = .new(3, 0, 0);

  static const ApiState createWorkflowState = .added;

  static const ApiVersion getWorkflowTriggersAddedIn = .new(3, 0, 0);

  static const ApiState getWorkflowTriggersState = .added;

  static const ApiVersion deleteWorkflowAddedIn = .new(3, 0, 0);

  static const ApiState deleteWorkflowState = .added;

  static const ApiVersion getWorkflowAddedIn = .new(3, 0, 0);

  static const ApiState getWorkflowState = .added;

  static const ApiVersion updateWorkflowAddedIn = .new(3, 0, 0);

  static const ApiState updateWorkflowState = .added;

  static const ApiVersion getWorkflowForShareAddedIn = .new(3, 0, 0);

  static const ApiState getWorkflowForShareState = .added;

  /// List all workflows
  ///
  /// Retrieve a list of workflows available to the authenticated user.
  ///
  /// Available since server v3.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> searchWorkflowsWithHttpInfo({
    String? description,
    bool? enabled,
    String? id,
    String? name,
    WorkflowTrigger? trigger,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/workflows';

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
      r'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// List all workflows
  ///
  /// Retrieve a list of workflows available to the authenticated user.
  ///
  /// Available since server v3.0.0.
  Future<List<WorkflowResponseDto>> searchWorkflows({
    String? description,
    bool? enabled,
    String? id,
    String? name,
    WorkflowTrigger? trigger,
    Future<void>? abortTrigger,
  }) async {
    final response = await searchWorkflowsWithHttpInfo(
      description: description,
      enabled: enabled,
      id: id,
      name: name,
      trigger: trigger,
      abortTrigger: abortTrigger,
    );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<WorkflowResponseDto>') as List)
          .cast<WorkflowResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create a workflow
  ///
  /// Create a new workflow, the workflow can also be created with empty filters and actions.
  ///
  /// Available since server v3.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createWorkflowWithHttpInfo(WorkflowCreateDto workflowCreateDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/workflows';

    Object? postBody = workflowCreateDto;

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

  /// Create a workflow
  ///
  /// Create a new workflow, the workflow can also be created with empty filters and actions.
  ///
  /// Available since server v3.0.0.
  Future<WorkflowResponseDto> createWorkflow(WorkflowCreateDto workflowCreateDto, {Future<void>? abortTrigger}) async {
    final response = await createWorkflowWithHttpInfo(workflowCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'WorkflowResponseDto')
          as WorkflowResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// List all workflow triggers
  ///
  /// Retrieve a list of all available workflow triggers.
  ///
  /// Available since server v3.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getWorkflowTriggersWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/workflows/triggers';

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

  /// List all workflow triggers
  ///
  /// Retrieve a list of all available workflow triggers.
  ///
  /// Available since server v3.0.0.
  Future<List<WorkflowTriggerResponseDto>> getWorkflowTriggers({Future<void>? abortTrigger}) async {
    final response = await getWorkflowTriggersWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<WorkflowTriggerResponseDto>') as List)
          .cast<WorkflowTriggerResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete a workflow
  ///
  /// Delete a workflow by its ID.
  ///
  /// Available since server v3.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteWorkflowWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/workflows/{id}'.replaceAll('{id}', id);

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

  /// Delete a workflow
  ///
  /// Delete a workflow by its ID.
  ///
  /// Available since server v3.0.0.
  Future<void> deleteWorkflow(String id, {Future<void>? abortTrigger}) async {
    final response = await deleteWorkflowWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve a workflow
  ///
  /// Retrieve information about a specific workflow by its ID.
  ///
  /// Available since server v3.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getWorkflowWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/workflows/{id}'.replaceAll('{id}', id);

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

  /// Retrieve a workflow
  ///
  /// Retrieve information about a specific workflow by its ID.
  ///
  /// Available since server v3.0.0.
  Future<WorkflowResponseDto> getWorkflow(String id, {Future<void>? abortTrigger}) async {
    final response = await getWorkflowWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'WorkflowResponseDto')
          as WorkflowResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update a workflow
  ///
  /// Update the information of a specific workflow by its ID. This endpoint can be used to update the workflow name, description, trigger type, filters and actions order, etc.
  ///
  /// Available since server v3.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateWorkflowWithHttpInfo(
    String id,
    WorkflowUpdateDto workflowUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/workflows/{id}'.replaceAll('{id}', id);

    Object? postBody = workflowUpdateDto;

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

  /// Update a workflow
  ///
  /// Update the information of a specific workflow by its ID. This endpoint can be used to update the workflow name, description, trigger type, filters and actions order, etc.
  ///
  /// Available since server v3.0.0.
  Future<WorkflowResponseDto> updateWorkflow(
    String id,
    WorkflowUpdateDto workflowUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateWorkflowWithHttpInfo(id, workflowUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'WorkflowResponseDto')
          as WorkflowResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve a workflow
  ///
  /// Retrieve a workflow details without ids, default values, etc.
  ///
  /// Available since server v3.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getWorkflowForShareWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/workflows/{id}/share'.replaceAll('{id}', id);

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

  /// Retrieve a workflow
  ///
  /// Retrieve a workflow details without ids, default values, etc.
  ///
  /// Available since server v3.0.0.
  Future<WorkflowShareResponseDto> getWorkflowForShare(String id, {Future<void>? abortTrigger}) async {
    final response = await getWorkflowForShareWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'WorkflowShareResponseDto')
          as WorkflowShareResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
