//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class LibraryApi {
  LibraryApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'POST /library' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [CreateLibraryDto] createLibraryDto (required):
  Future<Response> createLibraryWithHttpInfo(CreateLibraryDto createLibraryDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/library';

    // ignore: prefer_final_locals
    Object? postBody = createLibraryDto;

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
  /// * [CreateLibraryDto] createLibraryDto (required):
  Future<LibraryResponseDto?> createLibrary(CreateLibraryDto createLibraryDto,) async {
    final response = await createLibraryWithHttpInfo(createLibraryDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LibraryResponseDto',) as LibraryResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /library' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] assetId (required):
  Future<Response> getAllLibrariesWithHttpInfo(String assetId,) async {
    // ignore: prefer_const_declarations
    final path = r'/library';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'assetId', assetId));

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
  /// * [String] assetId (required):
  Future<List<LibraryResponseDto>?> getAllLibraries(String assetId,) async {
    final response = await getAllLibrariesWithHttpInfo(assetId,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<LibraryResponseDto>') as List)
        .cast<LibraryResponseDto>()
        .toList();

    }
    return null;
  }

  /// Performs an HTTP 'GET /library/count' operation and returns the [Response].
  Future<Response> getLibraryCountWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final path = r'/library/count';

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

  Future<num?> getLibraryCount() async {
    final response = await getLibraryCountWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'num',) as num;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /library/scan' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [ScanLibraryDto] scanLibraryDto (required):
  Future<Response> scanWithHttpInfo(ScanLibraryDto scanLibraryDto,) async {
    // ignore: prefer_const_declarations
    final path = r'/library/scan';

    // ignore: prefer_final_locals
    Object? postBody = scanLibraryDto;

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
  /// * [ScanLibraryDto] scanLibraryDto (required):
  Future<void> scan(ScanLibraryDto scanLibraryDto,) async {
    final response = await scanWithHttpInfo(scanLibraryDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
