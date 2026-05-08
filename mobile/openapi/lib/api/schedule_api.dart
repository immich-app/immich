//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class ScheduleApi {
  ScheduleApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /yucca/schedule' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [ScheduleCreateRequestDto] scheduleCreateRequestDto (required):
  Future<Response> createScheduleWithHttpInfo(ScheduleCreateRequestDto scheduleCreateRequestDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/schedule';

    // ignore: prefer_final_locals
    Object? postBody = scheduleCreateRequestDto;

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

  /// Parameters:
  ///
  /// * [ScheduleCreateRequestDto] scheduleCreateRequestDto (required):
  Future<ScheduleCreateResponseDto?> createSchedule(ScheduleCreateRequestDto scheduleCreateRequestDto,) async {
    final response = await createScheduleWithHttpInfo(scheduleCreateRequestDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ScheduleCreateResponseDto',) as ScheduleCreateResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /yucca/schedule' operation and returns the [Response].
  Future<Response> getSchedulesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/schedule';

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

  Future<ScheduleListResponseDto?> getSchedules() async {
    final response = await getSchedulesWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ScheduleListResponseDto',) as ScheduleListResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'DELETE /yucca/schedule/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> removeScheduleWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/schedule/{id}'
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

  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> removeSchedule(String id,) async {
    final response = await removeScheduleWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'PATCH /yucca/schedule/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [ScheduleUpdateRequestDto] scheduleUpdateRequestDto (required):
  Future<Response> updateScheduleWithHttpInfo(String id, ScheduleUpdateRequestDto scheduleUpdateRequestDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/schedule/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = scheduleUpdateRequestDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


    return apiClient.invokeAPI(
      apiPath,
      'PATCH',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
    );
  }

  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [ScheduleUpdateRequestDto] scheduleUpdateRequestDto (required):
  Future<ScheduleUpdateResponseDto?> updateSchedule(String id, ScheduleUpdateRequestDto scheduleUpdateRequestDto,) async {
    final response = await updateScheduleWithHttpInfo(id, scheduleUpdateRequestDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ScheduleUpdateResponseDto',) as ScheduleUpdateResponseDto;
    
    }
    return null;
  }
}
