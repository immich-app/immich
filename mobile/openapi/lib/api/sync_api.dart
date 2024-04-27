//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.12

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SyncApi {
  SyncApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'GET /sync/full-sync' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [int] limit (required):
  ///
  /// * [DateTime] updatedUntil (required):
  ///
  /// * [DateTime] lastCreationDate:
  ///
  /// * [String] lastId:
  ///
  /// * [String] userId:
  Future<Response> getAllForUserFullSyncWithHttpInfo(int limit, DateTime updatedUntil, { DateTime? lastCreationDate, String? lastId, String? userId, }) async {
    // ignore: prefer_const_declarations
    final path = r'/sync/full-sync';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    if (lastCreationDate != null) {
      queryParams.addAll(_queryParams('', 'lastCreationDate', lastCreationDate));
    }
    if (lastId != null) {
      queryParams.addAll(_queryParams('', 'lastId', lastId));
    }
      queryParams.addAll(_queryParams('', 'limit', limit));
      queryParams.addAll(_queryParams('', 'updatedUntil', updatedUntil));
    if (userId != null) {
      queryParams.addAll(_queryParams('', 'userId', userId));
    }

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
  /// * [int] limit (required):
  ///
  /// * [DateTime] updatedUntil (required):
  ///
  /// * [DateTime] lastCreationDate:
  ///
  /// * [String] lastId:
  ///
  /// * [String] userId:
  Future<List<AssetResponseDto>?> getAllForUserFullSync(int limit, DateTime updatedUntil, { DateTime? lastCreationDate, String? lastId, String? userId, }) async {
    final response = await getAllForUserFullSyncWithHttpInfo(limit, updatedUntil,  lastCreationDate: lastCreationDate, lastId: lastId, userId: userId, );
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<AssetResponseDto>') as List)
        .cast<AssetResponseDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Performs an HTTP 'GET /sync/delta-sync' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [DateTime] updatedAfter (required):
  ///
  /// * [List<String>] userIds (required):
  Future<Response> getDeltaSyncWithHttpInfo(DateTime updatedAfter, List<String> userIds,) async {
    // ignore: prefer_const_declarations
    final path = r'/sync/delta-sync';

    // ignore: prefer_final_locals
    Object? postBody;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

      queryParams.addAll(_queryParams('', 'updatedAfter', updatedAfter));
      queryParams.addAll(_queryParams('multi', 'userIds', userIds));

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
  /// * [DateTime] updatedAfter (required):
  ///
  /// * [List<String>] userIds (required):
  Future<AssetDeltaSyncResponseDto?> getDeltaSync(DateTime updatedAfter, List<String> userIds,) async {
    final response = await getDeltaSyncWithHttpInfo(updatedAfter, userIds,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      return await apiClient.deserializeAsync(await _decodeBodyBytes(response), 'AssetDeltaSyncResponseDto',) as AssetDeltaSyncResponseDto;
    
    }
    return null;
  }
}
