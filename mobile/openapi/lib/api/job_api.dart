//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class JobApi {
  JobApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /job' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [CreateJobDto] createJobDto (required):
  Future<Response> createWithHttpInfo(CreateJobDto createJobDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/job';

    // ignore: prefer_final_locals
    Object? postBody = createJobDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      path,
      'POST',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [CreateJobDto] createJobDto (required):
  Future<Object?> create(CreateJobDto createJobDto,) async {
    final response = await createWithHttpInfo(createJobDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'Object',) as Object;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /job' operation and returns the [Response].
  Future<Response> getAllJobsStatusWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/job';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  Future<AllJobStatusResponseDto?> getAllJobsStatus() async {
    final response = await getAllJobsStatusWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AllJobStatusResponseDto',) as AllJobStatusResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /job/one' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [JobType] jobType (required):
  Future<Response> getJobStatusWithHttpInfo(JobType jobType,) async {
    // ignore: prefer_const_declarations
    final path = r'/job/one';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'jobType', jobType));

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'GET',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [JobType] jobType (required):
  Future<JobStatusResponseDto?> getJobStatus(JobType jobType,) async {
    final response = await getJobStatusWithHttpInfo(jobType,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'JobStatusResponseDto',) as JobStatusResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'PUT /job/stop' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [JobType] jobType (required):
  Future<Response> stopJobWithHttpInfo(JobType jobType,) async {
    // ignore: prefer_const_declarations
    final path = r'/job/stop';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'jobType', jobType));

    const contentTypes = <String>[];


    return apiClient.invokeAPI(
      path,
      'PUT',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [JobType] jobType (required):
  Future<JobStatusResponseDto?> stopJob(JobType jobType,) async {
    final response = await stopJobWithHttpInfo(jobType,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'JobStatusResponseDto',) as JobStatusResponseDto;
    
    }
    return null;
  }
}
