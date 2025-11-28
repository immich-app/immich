//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class JobsApi {
  JobsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create a manual job
  ///
  /// Run a specific job. Most jobs are queued automatically, but this endpoint allows for manual creation of a handful of jobs, including various cleanup tasks, as well as creating a new database backup.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [JobCreateDto] jobCreateDto (required):
  Future<Response> createJobWithHttpInfo(JobCreateDto jobCreateDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/jobs';

    // ignore: prefer_final_locals
    Object? postBody = jobCreateDto;

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

  /// Create a manual job
  ///
  /// Run a specific job. Most jobs are queued automatically, but this endpoint allows for manual creation of a handful of jobs, including various cleanup tasks, as well as creating a new database backup.
  ///
  /// Parameters:
  ///
  /// * [JobCreateDto] jobCreateDto (required):
  Future<void> createJob(JobCreateDto jobCreateDto,) async {
    final response = await createJobWithHttpInfo(jobCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve queue counts and status
  ///
  /// Retrieve the counts of the current queue, as well as the current status.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getQueuesLegacyWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/jobs';

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

  /// Retrieve queue counts and status
  ///
  /// Retrieve the counts of the current queue, as well as the current status.
  Future<QueuesResponseLegacyDto?> getQueuesLegacy() async {
    final response = await getQueuesLegacyWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'QueuesResponseLegacyDto',) as QueuesResponseLegacyDto;
    
    }
    return null;
  }

  /// Run jobs
  ///
  /// Queue all assets for a specific job type. Defaults to only queueing assets that have not yet been processed, but the force command can be used to re-process all assets.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [QueueName] name (required):
  ///
  /// * [QueueCommandDto] queueCommandDto (required):
  Future<Response> runQueueCommandLegacyWithHttpInfo(QueueName name, QueueCommandDto queueCommandDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/jobs/{name}'
      .replaceAll('{name}', name.toString());

    // ignore: prefer_final_locals
    Object? postBody = queueCommandDto;

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

  /// Run jobs
  ///
  /// Queue all assets for a specific job type. Defaults to only queueing assets that have not yet been processed, but the force command can be used to re-process all assets.
  ///
  /// Parameters:
  ///
  /// * [QueueName] name (required):
  ///
  /// * [QueueCommandDto] queueCommandDto (required):
  Future<QueueResponseLegacyDto?> runQueueCommandLegacy(QueueName name, QueueCommandDto queueCommandDto,) async {
    final response = await runQueueCommandLegacyWithHttpInfo(name, queueCommandDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'QueueResponseLegacyDto',) as QueueResponseLegacyDto;
    
    }
    return null;
  }
}
