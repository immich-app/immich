//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class QueuesApi {
  QueuesApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Empty a queue
  ///
  /// Removes all jobs from the specified queue.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [QueueName] name (required):
  ///
  /// * [QueueDeleteDto] queueDeleteDto (required):
  Future<Response> emptyQueueWithHttpInfo(QueueName name, QueueDeleteDto queueDeleteDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/queues/{name}/jobs'
      .replaceAll('{name}', name.toString());

    // ignore: prefer_final_locals
    Object? postBody = queueDeleteDto;

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

  /// Empty a queue
  ///
  /// Removes all jobs from the specified queue.
  ///
  /// Parameters:
  ///
  /// * [QueueName] name (required):
  ///
  /// * [QueueDeleteDto] queueDeleteDto (required):
  Future<void> emptyQueue(QueueName name, QueueDeleteDto queueDeleteDto,) async {
    final response = await emptyQueueWithHttpInfo(name, queueDeleteDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve a queue
  ///
  /// Retrieves a specific queue by its name.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [QueueName] name (required):
  Future<Response> getQueueWithHttpInfo(QueueName name,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/queues/{name}'
      .replaceAll('{name}', name.toString());

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

  /// Retrieve a queue
  ///
  /// Retrieves a specific queue by its name.
  ///
  /// Parameters:
  ///
  /// * [QueueName] name (required):
  Future<QueueResponseDto?> getQueue(QueueName name,) async {
    final response = await getQueueWithHttpInfo(name,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'QueueResponseDto',) as QueueResponseDto;
    
    }
    return null;
  }

  /// Retrieve queue jobs
  ///
  /// Retrieves a list of queue jobs from the specified queue.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [QueueName] name (required):
  ///
  /// * [List<QueueJobStatus>] status:
  Future<Response> getQueueJobsWithHttpInfo(QueueName name, { List<QueueJobStatus>? status, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/queues/{name}/jobs'
      .replaceAll('{name}', name.toString());

    // ignore: prefer_final_locals
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
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Retrieve queue jobs
  ///
  /// Retrieves a list of queue jobs from the specified queue.
  ///
  /// Parameters:
  ///
  /// * [QueueName] name (required):
  ///
  /// * [List<QueueJobStatus>] status:
  Future<List<QueueJobResponseDto>?> getQueueJobs(QueueName name, { List<QueueJobStatus>? status, }) async {
    final response = await getQueueJobsWithHttpInfo(name,  status: status, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<QueueJobResponseDto>') as List)
        .cast<QueueJobResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// List all queues
  ///
  /// Retrieves a list of queues.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getQueuesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/queues';

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

  /// List all queues
  ///
  /// Retrieves a list of queues.
  Future<List<QueueResponseDto>?> getQueues() async {
    final response = await getQueuesWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<QueueResponseDto>') as List)
        .cast<QueueResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Update a queue
  ///
  /// Change the paused status of a specific queue.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [QueueName] name (required):
  ///
  /// * [QueueUpdateDto] queueUpdateDto (required):
  Future<Response> updateQueueWithHttpInfo(QueueName name, QueueUpdateDto queueUpdateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/queues/{name}'
      .replaceAll('{name}', name.toString());

    // ignore: prefer_final_locals
    Object? postBody = queueUpdateDto;

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

  /// Update a queue
  ///
  /// Change the paused status of a specific queue.
  ///
  /// Parameters:
  ///
  /// * [QueueName] name (required):
  ///
  /// * [QueueUpdateDto] queueUpdateDto (required):
  Future<QueueResponseDto?> updateQueue(QueueName name, QueueUpdateDto queueUpdateDto,) async {
    final response = await updateQueueWithHttpInfo(name, queueUpdateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'QueueResponseDto',) as QueueResponseDto;
    
    }
    return null;
  }
}
