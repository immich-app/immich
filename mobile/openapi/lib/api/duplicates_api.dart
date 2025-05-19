//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class DuplicatesApi {
  DuplicatesApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /duplicates/bulk/deduplicate' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [DeduplicateAllDto] deduplicateAllDto (required):
  Future<Response> deduplicateAllWithHttpInfo(DeduplicateAllDto deduplicateAllDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/duplicates/bulk/deduplicate';

    // ignore: prefer_final_locals
    Object? postBody = deduplicateAllDto;

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
  /// * [DeduplicateAllDto] deduplicateAllDto (required):
  Future<void> deduplicateAll(DeduplicateAllDto deduplicateAllDto,) async {
    final response = await deduplicateAllWithHttpInfo(deduplicateAllDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'GET /duplicates' operation and returns the [Response].
  Future<Response> getAssetDuplicatesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/duplicates';

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

  Future<List<DuplicateResponseDto>?> getAssetDuplicates() async {
    final response = await getAssetDuplicatesWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<DuplicateResponseDto>') as List)
        .cast<DuplicateResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Performs an HTTP 'POST /duplicates/bulk/keep' operation and returns the [Response].
  Future<Response> keepAllWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/duplicates/bulk/keep';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];


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

  Future<void> keepAll() async {
    final response = await keepAllWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
