// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class QueuesApi {
  QueuesApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getQueuesAddedIn = .new(2, 4, 0);

  static const ApiState getQueuesState = .alpha;

  static const ApiVersion getQueueAddedIn = .new(2, 4, 0);

  static const ApiState getQueueState = .alpha;

  static const ApiVersion updateQueueAddedIn = .new(2, 4, 0);

  static const ApiState updateQueueState = .alpha;

  static const ApiVersion emptyQueueAddedIn = .new(2, 4, 0);

  static const ApiState emptyQueueState = .alpha;

  static const ApiVersion getQueueJobsAddedIn = .new(2, 4, 0);

  static const ApiState getQueueJobsState = .alpha;

  /// List all queues
  ///
  /// Retrieves a list of queues.
  ///
  /// Available since server v2.4.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getQueuesWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/queues';

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

  /// List all queues
  ///
  /// Retrieves a list of queues.
  ///
  /// Available since server v2.4.0.
  Future<List<QueueResponseDto>> getQueues({Future<void>? abortTrigger}) async {
    final response = await getQueuesWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<QueueResponseDto>') as List)
          .cast<QueueResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Retrieve a queue
  ///
  /// Retrieves a specific queue by its name.
  ///
  /// Available since server v2.4.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getQueueWithHttpInfo(QueueName name, {Future<void>? abortTrigger}) async {
    final apiPath = r'/queues/{name}'.replaceAll('{name}', parameterToString(name));

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

  /// Retrieve a queue
  ///
  /// Retrieves a specific queue by its name.
  ///
  /// Available since server v2.4.0.
  Future<QueueResponseDto> getQueue(QueueName name, {Future<void>? abortTrigger}) async {
    final response = await getQueueWithHttpInfo(name, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'QueueResponseDto')
          as QueueResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update a queue
  ///
  /// Change the paused status of a specific queue.
  ///
  /// Available since server v2.4.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateQueueWithHttpInfo(
    QueueName name,
    QueueUpdateDto queueUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/queues/{name}'.replaceAll('{name}', parameterToString(name));

    Object? postBody = queueUpdateDto;

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

  /// Update a queue
  ///
  /// Change the paused status of a specific queue.
  ///
  /// Available since server v2.4.0.
  Future<QueueResponseDto> updateQueue(
    QueueName name,
    QueueUpdateDto queueUpdateDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateQueueWithHttpInfo(name, queueUpdateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'QueueResponseDto')
          as QueueResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Empty a queue
  ///
  /// Removes all jobs from the specified queue.
  ///
  /// Available since server v2.4.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> emptyQueueWithHttpInfo(
    QueueName name,
    QueueDeleteDto queueDeleteDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/queues/{name}/jobs'.replaceAll('{name}', parameterToString(name));

    Object? postBody = queueDeleteDto;

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

  /// Empty a queue
  ///
  /// Removes all jobs from the specified queue.
  ///
  /// Available since server v2.4.0.
  Future<void> emptyQueue(QueueName name, QueueDeleteDto queueDeleteDto, {Future<void>? abortTrigger}) async {
    final response = await emptyQueueWithHttpInfo(name, queueDeleteDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve queue jobs
  ///
  /// Retrieves a list of queue jobs from the specified queue.
  ///
  /// Available since server v2.4.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getQueueJobsWithHttpInfo(
    QueueName name, {
    List<QueueJobStatus>? status,
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/queues/{name}/jobs'.replaceAll('{name}', parameterToString(name));

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (status != null) {
      queryParams.addAll(_queryParams('multi', 'status', status));
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

  /// Retrieve queue jobs
  ///
  /// Retrieves a list of queue jobs from the specified queue.
  ///
  /// Available since server v2.4.0.
  Future<List<QueueJobResponseDto>> getQueueJobs(
    QueueName name, {
    List<QueueJobStatus>? status,
    Future<void>? abortTrigger,
  }) async {
    final response = await getQueueJobsWithHttpInfo(name, status: status, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<QueueJobResponseDto>') as List)
          .cast<QueueJobResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
