//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class FileReportsApi {
  FileReportsApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /reports/fix' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [FileReportFixDto] fileReportFixDto (required):
  Future<Response> fixAuditFilesWithHttpInfo(FileReportFixDto fileReportFixDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/reports/fix';

    // ignore: prefer_final_locals
    Object? postBody = fileReportFixDto;

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
  /// * [FileReportFixDto] fileReportFixDto (required):
  Future<void> fixAuditFiles(FileReportFixDto fileReportFixDto,) async {
    final response = await fixAuditFilesWithHttpInfo(fileReportFixDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'GET /reports' operation and returns the [Response].
  Future<Response> getAuditFilesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/reports';

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

  Future<FileReportDto?> getAuditFiles() async {
    final response = await getAuditFilesWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'FileReportDto',) as FileReportDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /reports/checksum' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [FileChecksumDto] fileChecksumDto (required):
  Future<Response> getFileChecksumsWithHttpInfo(FileChecksumDto fileChecksumDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/reports/checksum';

    // ignore: prefer_final_locals
    Object? postBody = fileChecksumDto;

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
  /// * [FileChecksumDto] fileChecksumDto (required):
  Future<List<FileChecksumResponseDto>?> getFileChecksums(FileChecksumDto fileChecksumDto,) async {
    final response = await getFileChecksumsWithHttpInfo(fileChecksumDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<FileChecksumResponseDto>') as List)
        .cast<FileChecksumResponseDto>()
        .toList(growable: false);

    }
    return null;
  }
}
