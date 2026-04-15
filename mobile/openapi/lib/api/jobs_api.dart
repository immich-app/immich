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
}
