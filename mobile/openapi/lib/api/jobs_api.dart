// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class JobsApi {
  JobsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getQueuesLegacyAddedIn = .new(1, 0, 0);

  static const ApiVersion getQueuesLegacyDeprecatedIn = .new(2, 4, 0);

  static const ApiState getQueuesLegacyState = .deprecated;

  static const ApiVersion createJobAddedIn = .new(1, 0, 0);

  static const ApiState createJobState = .stable;

  static const ApiVersion runQueueCommandLegacyAddedIn = .new(1, 0, 0);

  static const ApiVersion runQueueCommandLegacyDeprecatedIn = .new(2, 4, 0);

  static const ApiState runQueueCommandLegacyState = .deprecated;

  /// Retrieve queue counts and status
  ///
  /// Retrieve the counts of the current queue, as well as the current status.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  @Deprecated('Deprecated by the Immich server API since v2.4.0.')
  Future<Response> getQueuesLegacyWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/jobs';

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

  /// Retrieve queue counts and status
  ///
  /// Retrieve the counts of the current queue, as well as the current status.
  ///
  /// Available since server v1.0.0.
  @Deprecated('Deprecated by the Immich server API since v2.4.0.')
  Future<QueuesResponseLegacyDto> getQueuesLegacy({Future<void>? abortTrigger}) async {
    final response = await getQueuesLegacyWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'QueuesResponseLegacyDto')
          as QueuesResponseLegacyDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create a manual job
  ///
  /// Run a specific job. Most jobs are queued automatically, but this endpoint allows for manual creation of a handful of jobs, including various cleanup tasks, as well as creating a new database backup.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createJobWithHttpInfo(JobCreateDto jobCreateDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/jobs';

    Object? postBody = jobCreateDto;

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

  /// Create a manual job
  ///
  /// Run a specific job. Most jobs are queued automatically, but this endpoint allows for manual creation of a handful of jobs, including various cleanup tasks, as well as creating a new database backup.
  ///
  /// Available since server v1.0.0.
  Future<void> createJob(JobCreateDto jobCreateDto, {Future<void>? abortTrigger}) async {
    final response = await createJobWithHttpInfo(jobCreateDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Run jobs
  ///
  /// Queue all assets for a specific job type. Defaults to only queueing assets that have not yet been processed, but the force command can be used to re-process all assets.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  @Deprecated('Deprecated by the Immich server API since v2.4.0.')
  Future<Response> runQueueCommandLegacyWithHttpInfo(
    QueueName name,
    QueueCommandDto queueCommandDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/jobs/{name}'.replaceAll('{name}', parameterToString(name));

    Object? postBody = queueCommandDto;

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

  /// Run jobs
  ///
  /// Queue all assets for a specific job type. Defaults to only queueing assets that have not yet been processed, but the force command can be used to re-process all assets.
  ///
  /// Available since server v1.0.0.
  @Deprecated('Deprecated by the Immich server API since v2.4.0.')
  Future<QueueResponseLegacyDto> runQueueCommandLegacy(
    QueueName name,
    QueueCommandDto queueCommandDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await runQueueCommandLegacyWithHttpInfo(name, queueCommandDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'QueueResponseLegacyDto')
          as QueueResponseLegacyDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
