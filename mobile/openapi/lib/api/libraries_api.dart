// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class LibrariesApi {
  LibrariesApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion getAllLibrariesAddedIn = .new(1, 0, 0);

  static const ApiState getAllLibrariesState = .stable;

  static const ApiVersion createLibraryAddedIn = .new(1, 0, 0);

  static const ApiState createLibraryState = .stable;

  static const ApiVersion deleteLibraryAddedIn = .new(1, 0, 0);

  static const ApiState deleteLibraryState = .stable;

  static const ApiVersion getLibraryAddedIn = .new(1, 0, 0);

  static const ApiState getLibraryState = .stable;

  static const ApiVersion updateLibraryAddedIn = .new(1, 0, 0);

  static const ApiState updateLibraryState = .stable;

  static const ApiVersion scanLibraryAddedIn = .new(1, 0, 0);

  static const ApiState scanLibraryState = .stable;

  static const ApiVersion getLibraryStatisticsAddedIn = .new(1, 0, 0);

  static const ApiState getLibraryStatisticsState = .stable;

  static const ApiVersion validateAddedIn = .new(1, 0, 0);

  static const ApiState validateState = .stable;

  /// Retrieve libraries
  ///
  /// Retrieve a list of external libraries.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getAllLibrariesWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/libraries';

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

  /// Retrieve libraries
  ///
  /// Retrieve a list of external libraries.
  ///
  /// Available since server v1.0.0.
  Future<List<LibraryResponseDto>> getAllLibraries({Future<void>? abortTrigger}) async {
    final response = await getAllLibrariesWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<LibraryResponseDto>') as List)
          .cast<LibraryResponseDto>()
          .toList(growable: false);
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Create a library
  ///
  /// Create a new external library.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> createLibraryWithHttpInfo(CreateLibraryDto createLibraryDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/libraries';

    Object? postBody = createLibraryDto;

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

  /// Create a library
  ///
  /// Create a new external library.
  ///
  /// Available since server v1.0.0.
  Future<LibraryResponseDto> createLibrary(CreateLibraryDto createLibraryDto, {Future<void>? abortTrigger}) async {
    final response = await createLibraryWithHttpInfo(createLibraryDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'LibraryResponseDto')
          as LibraryResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Delete a library
  ///
  /// Delete an external library by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteLibraryWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/libraries/{id}'.replaceAll('{id}', id);

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

    return apiClient.invokeAPI(
      apiPath,
      r'DELETE',
      queryParams,
      postBody,
      headerParams,
      formParams,
      contentTypes.isEmpty ? null : contentTypes.first,
      abortTrigger: abortTrigger,
    );
  }

  /// Delete a library
  ///
  /// Delete an external library by its ID.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteLibrary(String id, {Future<void>? abortTrigger}) async {
    final response = await deleteLibraryWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve a library
  ///
  /// Retrieve an external library by its ID.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getLibraryWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/libraries/{id}'.replaceAll('{id}', id);

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

  /// Retrieve a library
  ///
  /// Retrieve an external library by its ID.
  ///
  /// Available since server v1.0.0.
  Future<LibraryResponseDto> getLibrary(String id, {Future<void>? abortTrigger}) async {
    final response = await getLibraryWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'LibraryResponseDto')
          as LibraryResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Update a library
  ///
  /// Update an existing external library.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> updateLibraryWithHttpInfo(
    String id,
    UpdateLibraryDto updateLibraryDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/libraries/{id}'.replaceAll('{id}', id);

    Object? postBody = updateLibraryDto;

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

  /// Update a library
  ///
  /// Update an existing external library.
  ///
  /// Available since server v1.0.0.
  Future<LibraryResponseDto> updateLibrary(
    String id,
    UpdateLibraryDto updateLibraryDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await updateLibraryWithHttpInfo(id, updateLibraryDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'LibraryResponseDto')
          as LibraryResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Scan a library
  ///
  /// Queue a scan for the external library to find and import new assets.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> scanLibraryWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/libraries/{id}/scan'.replaceAll('{id}', id);

    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[];

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

  /// Scan a library
  ///
  /// Queue a scan for the external library to find and import new assets.
  ///
  /// Available since server v1.0.0.
  Future<void> scanLibrary(String id, {Future<void>? abortTrigger}) async {
    final response = await scanLibraryWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve library statistics
  ///
  /// Retrieve statistics for a specific external library, including number of videos, images, and storage usage.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getLibraryStatisticsWithHttpInfo(String id, {Future<void>? abortTrigger}) async {
    final apiPath = r'/libraries/{id}/statistics'.replaceAll('{id}', id);

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

  /// Retrieve library statistics
  ///
  /// Retrieve statistics for a specific external library, including number of videos, images, and storage usage.
  ///
  /// Available since server v1.0.0.
  Future<LibraryStatsResponseDto> getLibraryStatistics(String id, {Future<void>? abortTrigger}) async {
    final response = await getLibraryStatisticsWithHttpInfo(id, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'LibraryStatsResponseDto')
          as LibraryStatsResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Validate library settings
  ///
  /// Validate the settings of an external library.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> validateWithHttpInfo(
    String id,
    ValidateLibraryDto validateLibraryDto, {
    Future<void>? abortTrigger,
  }) async {
    final apiPath = r'/libraries/{id}/validate'.replaceAll('{id}', id);

    Object? postBody = validateLibraryDto;

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

  /// Validate library settings
  ///
  /// Validate the settings of an external library.
  ///
  /// Available since server v1.0.0.
  Future<ValidateLibraryResponseDto> validate(
    String id,
    ValidateLibraryDto validateLibraryDto, {
    Future<void>? abortTrigger,
  }) async {
    final response = await validateWithHttpInfo(id, validateLibraryDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), r'ValidateLibraryResponseDto')
          as ValidateLibraryResponseDto;
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }
}
