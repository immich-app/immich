//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class RepositoryApi {
  RepositoryApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'GET /yucca/repository/{id}/import' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] backend (required):
  ///
  /// * [String] id (required):
  Future<Response> checkImportRepositoryWithHttpInfo(String backend, String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/repository/{id}/import'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'backend', backend));

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

  /// Parameters:
  ///
  /// * [String] backend (required):
  ///
  /// * [String] id (required):
  Future<RepositoryCheckImportResponseDto?> checkImportRepository(String backend, String id,) async {
    final response = await checkImportRepositoryWithHttpInfo(backend, id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RepositoryCheckImportResponseDto',) as RepositoryCheckImportResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /yucca/repository/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> createBackupWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/repository/{id}'
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

  /// Parameters:
  ///
  /// * [String] id (required):
  Future<LogResponseDto?> createBackup(String id,) async {
    final response = await createBackupWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LogResponseDto',) as LogResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /yucca/repository' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [RepositoryCreateRequestDto] repositoryCreateRequestDto (required):
  ///
  /// * [String] backend:
  Future<Response> createRepositoryWithHttpInfo(RepositoryCreateRequestDto repositoryCreateRequestDto, { String? backend, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/repository';

    // ignore: prefer_final_locals
    Object? postBody = repositoryCreateRequestDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (backend != null) {
      queryParams.addAll(_queryParams('', 'backend', backend));
    }

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
  /// * [RepositoryCreateRequestDto] repositoryCreateRequestDto (required):
  ///
  /// * [String] backend:
  Future<RepositoryCreateResponseDto?> createRepository(RepositoryCreateRequestDto repositoryCreateRequestDto, { String? backend, }) async {
    final response = await createRepositoryWithHttpInfo(repositoryCreateRequestDto,  backend: backend, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RepositoryCreateResponseDto',) as RepositoryCreateResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'DELETE /yucca/repository/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> deleteRepositoryWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/repository/{id}'
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
  Future<void> deleteRepository(String id,) async {
    final response = await deleteRepositoryWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'DELETE /yucca/repository/{id}/snapshots/{snapshot}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] snapshot (required):
  Future<Response> forgetSnapshotWithHttpInfo(String id, String snapshot,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/repository/{id}/snapshots/{snapshot}'
      .replaceAll('{id}', id)
      .replaceAll('{snapshot}', snapshot);

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
  ///
  /// * [String] snapshot (required):
  Future<ListSnapshotsResponseDto?> forgetSnapshot(String id, String snapshot,) async {
    final response = await forgetSnapshotWithHttpInfo(id, snapshot,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ListSnapshotsResponseDto',) as ListSnapshotsResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /yucca/repository' operation and returns the [Response].
  Future<Response> getRepositoriesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/repository';

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

  Future<RepositoryListResponseDto?> getRepositories() async {
    final response = await getRepositoriesWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RepositoryListResponseDto',) as RepositoryListResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /yucca/repository/{id}/runs' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getRunHistoryWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/repository/{id}/runs'
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

  /// Parameters:
  ///
  /// * [String] id (required):
  Future<RunHistoryResponseDto?> getRunHistory(String id,) async {
    final response = await getRunHistoryWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RunHistoryResponseDto',) as RunHistoryResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /yucca/repository/{id}/snapshots/{snapshot}/listing' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] snapshot (required):
  ///
  /// * [String] path:
  Future<Response> getSnapshotListingWithHttpInfo(String id, String snapshot, { String? path, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/repository/{id}/snapshots/{snapshot}/listing'
      .replaceAll('{id}', id)
      .replaceAll('{snapshot}', snapshot);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (path != null) {
      queryParams.addAll(_queryParams('', 'path', path));
    }

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

  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] snapshot (required):
  ///
  /// * [String] path:
  Future<FilesystemListingResponseDto?> getSnapshotListing(String id, String snapshot, { String? path, }) async {
    final response = await getSnapshotListingWithHttpInfo(id, snapshot,  path: path, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'FilesystemListingResponseDto',) as FilesystemListingResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /yucca/repository/{id}/snapshots' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  Future<Response> getSnapshotsWithHttpInfo(String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/repository/{id}/snapshots'
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

  /// Parameters:
  ///
  /// * [String] id (required):
  Future<ListSnapshotsResponseDto?> getSnapshots(String id,) async {
    final response = await getSnapshotsWithHttpInfo(id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'ListSnapshotsResponseDto',) as ListSnapshotsResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /yucca/repository/{id}/import' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] backend (required):
  ///
  /// * [String] id (required):
  Future<Response> importRepositoryWithHttpInfo(String backend, String id,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/repository/{id}/import'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'backend', backend));

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

  /// Parameters:
  ///
  /// * [String] backend (required):
  ///
  /// * [String] id (required):
  Future<RepositoryCreateResponseDto?> importRepository(String backend, String id,) async {
    final response = await importRepositoryWithHttpInfo(backend, id,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RepositoryCreateResponseDto',) as RepositoryCreateResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'GET /yucca/repository/inspect' operation and returns the [Response].
  Future<Response> inspectRepositoriesWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/repository/inspect';

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

  Future<RepositoryInspectResponseDto?> inspectRepositories() async {
    final response = await inspectRepositoriesWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RepositoryInspectResponseDto',) as RepositoryInspectResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /yucca/repository/{id}/snapshots/{snapshot}/restore-from-point' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] backend (required):
  ///
  /// * [String] id (required):
  ///
  /// * [String] snapshot (required):
  ///
  /// * [RepositorySnapshotRestoreFromPointRequestDto] repositorySnapshotRestoreFromPointRequestDto (required):
  Future<Response> restoreFromPointWithHttpInfo(String backend, String id, String snapshot, RepositorySnapshotRestoreFromPointRequestDto repositorySnapshotRestoreFromPointRequestDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/repository/{id}/snapshots/{snapshot}/restore-from-point'
      .replaceAll('{id}', id)
      .replaceAll('{snapshot}', snapshot);

    // ignore: prefer_final_locals
    Object? postBody = repositorySnapshotRestoreFromPointRequestDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'backend', backend));

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
  /// * [String] backend (required):
  ///
  /// * [String] id (required):
  ///
  /// * [String] snapshot (required):
  ///
  /// * [RepositorySnapshotRestoreFromPointRequestDto] repositorySnapshotRestoreFromPointRequestDto (required):
  Future<LogResponseDto?> restoreFromPoint(String backend, String id, String snapshot, RepositorySnapshotRestoreFromPointRequestDto repositorySnapshotRestoreFromPointRequestDto,) async {
    final response = await restoreFromPointWithHttpInfo(backend, id, snapshot, repositorySnapshotRestoreFromPointRequestDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LogResponseDto',) as LogResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'POST /yucca/repository/{id}/snapshots/{snapshot}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [String] snapshot (required):
  ///
  /// * [RepositorySnapshotRestoreRequestDto] repositorySnapshotRestoreRequestDto (required):
  Future<Response> restoreSnapshotWithHttpInfo(String id, String snapshot, RepositorySnapshotRestoreRequestDto repositorySnapshotRestoreRequestDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/repository/{id}/snapshots/{snapshot}'
      .replaceAll('{id}', id)
      .replaceAll('{snapshot}', snapshot);

    // ignore: prefer_final_locals
    Object? postBody = repositorySnapshotRestoreRequestDto;

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
  /// * [String] id (required):
  ///
  /// * [String] snapshot (required):
  ///
  /// * [RepositorySnapshotRestoreRequestDto] repositorySnapshotRestoreRequestDto (required):
  Future<LogResponseDto?> restoreSnapshot(String id, String snapshot, RepositorySnapshotRestoreRequestDto repositorySnapshotRestoreRequestDto,) async {
    final response = await restoreSnapshotWithHttpInfo(id, snapshot, repositorySnapshotRestoreRequestDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'LogResponseDto',) as LogResponseDto;
    
    }
    return null;
  }

  /// Performs an HTTP 'PATCH /yucca/repository/{id}' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [String] id (required):
  ///
  /// * [RepositoryUpdateRequestDto] repositoryUpdateRequestDto (required):
  ///
  /// * [String] backend:
  Future<Response> updateRepositoryWithHttpInfo(String id, RepositoryUpdateRequestDto repositoryUpdateRequestDto, { String? backend, }) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/yucca/repository/{id}'
      .replaceAll('{id}', id);

    // ignore: prefer_final_locals
    Object? postBody = repositoryUpdateRequestDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (backend != null) {
      queryParams.addAll(_queryParams('', 'backend', backend));
    }

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
  /// * [RepositoryUpdateRequestDto] repositoryUpdateRequestDto (required):
  ///
  /// * [String] backend:
  Future<RepositoryUpdateResponseDto?> updateRepository(String id, RepositoryUpdateRequestDto repositoryUpdateRequestDto, { String? backend, }) async {
    final response = await updateRepositoryWithHttpInfo(id, repositoryUpdateRequestDto,  backend: backend, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'RepositoryUpdateResponseDto',) as RepositoryUpdateResponseDto;
    
    }
    return null;
  }
}
