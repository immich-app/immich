//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class LibrariesApi {
  LibrariesApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Create a library
  ///
  /// Create a new external library.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [CreateLibraryDto] createLibraryDto (required):
  Future<Response> createLibraryWithHttpInfo(CreateLibraryDto createLibraryDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/libraries';

    // ignore: prefer_final_locals
    Object? postBody = createLibraryDto;

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

  /// Create a library
  ///
  /// Create a new external library.
  ///
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

  /// Delete a library
  ///
  /// Delete an external library by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteLibraryWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/libraries/{id}'
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

  /// Delete a library
  ///
  /// Delete an external library by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> deleteLibrary(String id,) async {
    final response = await deleteLibraryWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve libraries
  ///
  /// Retrieve a list of external libraries.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAllLibrariesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/libraries';

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

  /// Retrieve libraries
  ///
  /// Retrieve a list of external libraries.
  Future<List<LibraryResponseDto>?> getAllLibraries() async {
    final response = await getAllLibrariesWithHttpInfo();
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
        .toList(growable: false);

    }
    return null;
  }

  /// Retrieve a library
  ///
  /// Retrieve an external library by its ID.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getLibraryWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/libraries/{id}'
      .replaceAll('{id}', id);

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

  /// Retrieve a library
  ///
  /// Retrieve an external library by its ID.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<LibraryResponseDto?> getLibrary(String id,) async {
    final response = await getLibraryWithHttpInfo(id,);
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

  /// Retrieve library statistics
  ///
  /// Retrieve statistics for a specific external library, including number of videos, images, and storage usage.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getLibraryStatisticsWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/libraries/{id}/statistics'
      .replaceAll('{id}', id);

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

  /// Retrieve library statistics
  ///
  /// Retrieve statistics for a specific external library, including number of videos, images, and storage usage.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<LibraryStatsResponseDto?> getLibraryStatistics(String id,) async {
    final response = await getLibraryStatisticsWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LibraryStatsResponseDto',) as LibraryStatsResponseDto;
    
    }
    return null;
  }

  /// Scan a library
  ///
  /// Queue a scan for the external library to find and import new assets.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> scanLibraryWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/libraries/{id}/scan'
      .replaceAll('{id}', id);

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

  /// Scan a library
  ///
  /// Queue a scan for the external library to find and import new assets.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<void> scanLibrary(String id,) async {
    final response = await scanLibraryWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Update a library
  ///
  /// Update an existing external library.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateLibraryDto] updateLibraryDto (required):
  Future<Response> updateLibraryWithHttpInfo(String id, UpdateLibraryDto updateLibraryDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/libraries/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = updateLibraryDto;

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

  /// Update a library
  ///
  /// Update an existing external library.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [UpdateLibraryDto] updateLibraryDto (required):
  Future<LibraryResponseDto?> updateLibrary(String id, UpdateLibraryDto updateLibraryDto,) async {
    final response = await updateLibraryWithHttpInfo(id, updateLibraryDto,);
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

  /// Validate library settings
  ///
  /// Validate the settings of an external library.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [ValidateLibraryDto] validateLibraryDto (required):
  Future<Response> validateWithHttpInfo(String id, ValidateLibraryDto validateLibraryDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/libraries/{id}/validate'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = validateLibraryDto;

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

  /// Validate library settings
  ///
  /// Validate the settings of an external library.
  ///
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [ValidateLibraryDto] validateLibraryDto (required):
  Future<ValidateLibraryResponseDto?> validate(String id, ValidateLibraryDto validateLibraryDto,) async {
    final response = await validateWithHttpInfo(id, validateLibraryDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ValidateLibraryResponseDto',) as ValidateLibraryResponseDto;
    
    }
    return null;
  }
}
