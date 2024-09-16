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

  /// Performs an HTTP 'POST /jobs' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [JobCreateDto] jobCreateDto (required):
  Future<Response> createJobWithHttpInfo(JobCreateDto jobCreateDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/jobs';

    // ignore: prefer_final_locals
    Object? postBody = jobCreateDto;

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
  /// * [JobCreateDto] jobCreateDto (required):
  Future<void> createJob(JobCreateDto jobCreateDto,) async {
    final response = await createJobWithHttpInfo(jobCreateDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'GET /jobs' operation and returns the [Response].
  Future<Response> getAllJobsStatusWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/jobs';

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

  /// Performs an HTTP 'PUT /jobs/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [JobName] id (required):
  ///
  /// * [JobCommandDto] jobCommandDto (required):
  Future<Response> sendJobCommandWithHttpInfo(JobName id, JobCommandDto jobCommandDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/jobs/{id}'
      .replaceAll('{id}', id.toString());

    // ignore: prefer_final_locals
    Object? postBody = jobCommandDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


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
  /// * [JobName] id (required):
  ///
  /// * [JobCommandDto] jobCommandDto (required):
  Future<JobStatusDto?> sendJobCommand(JobName id, JobCommandDto jobCommandDto,) async {
    final response = await sendJobCommandWithHttpInfo(id, jobCommandDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'JobStatusDto',) as JobStatusDto;
    
    }
    return null;
  }
}
