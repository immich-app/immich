//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//
// @dart=2.18

// ignore_for_file: unused_element, unused_import
// ignore_for_file: always_put_required_named_parameters_first
// ignore_for_file: constant_identifier_names
// ignore_for_file: lines_longer_than_80_chars

part of openapi.api;


class SyncApi {
  SyncApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  /// Performs an HTTP 'DELETE /sync/ack' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [SyncAckDeleteDto] syncAckDeleteDto (required):
  Future<Response> deleteSyncAckWithHttpInfo(SyncAckDeleteDto syncAckDeleteDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sync/ack';

    // ignore: prefer_final_locals
    Object? postBody = syncAckDeleteDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>['application/json'];


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
  /// * [SyncAckDeleteDto] syncAckDeleteDto (required):
  Future<void> deleteSyncAck(SyncAckDeleteDto syncAckDeleteDto,) async {
    final response = await deleteSyncAckWithHttpInfo(syncAckDeleteDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'POST /sync/delta-sync' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [AssetDeltaSyncDto] assetDeltaSyncDto (required):
  Future<Response> getDeltaSyncWithHttpInfo(AssetDeltaSyncDto assetDeltaSyncDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sync/delta-sync';

    // ignore: prefer_final_locals
    Object? postBody = assetDeltaSyncDto;

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
  /// * [AssetDeltaSyncDto] assetDeltaSyncDto (required):
  Future<AssetDeltaSyncResponseDto?> getDeltaSync(AssetDeltaSyncDto assetDeltaSyncDto,) async {
    final response = await getDeltaSyncWithHttpInfo(assetDeltaSyncDto,);
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

  /// Performs an HTTP 'POST /sync/full-sync' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [AssetFullSyncDto] assetFullSyncDto (required):
  Future<Response> getFullSyncForUserWithHttpInfo(AssetFullSyncDto assetFullSyncDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sync/full-sync';

    // ignore: prefer_final_locals
    Object? postBody = assetFullSyncDto;

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
  /// * [AssetFullSyncDto] assetFullSyncDto (required):
  Future<List<AssetResponseDto>?> getFullSyncForUser(AssetFullSyncDto assetFullSyncDto,) async {
    final response = await getFullSyncForUserWithHttpInfo(assetFullSyncDto,);
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

  /// Performs an HTTP 'GET /sync/ack' operation and returns the [Response].
  Future<Response> getSyncAckWithHttpInfo() async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sync/ack';

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

  Future<List<SyncAckDto>?> getSyncAck() async {
    final response = await getSyncAckWithHttpInfo();
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    // When a remote server returns no body with a status of 204, we shall not decode it.
    // At the time of writing this, `dart:convert` will throw an "Unexpected end of input"
    // FormatException when trying to decode an empty string.
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, 'List<SyncAckDto>') as List)
        .cast<SyncAckDto>()
        .toList(growable: false);

    }
    return null;
  }

  /// Performs an HTTP 'POST /sync/stream' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [SyncStreamDto] syncStreamDto (required):
  Future<Response> getSyncStreamWithHttpInfo(SyncStreamDto syncStreamDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sync/stream';

    // ignore: prefer_final_locals
    Object? postBody = syncStreamDto;

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
  /// * [SyncStreamDto] syncStreamDto (required):
  Future<void> getSyncStream(SyncStreamDto syncStreamDto,) async {
    final response = await getSyncStreamWithHttpInfo(syncStreamDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Performs an HTTP 'POST /sync/ack' operation and returns the [Response].
  /// Parameters:
  ///
  /// * [SyncAckSetDto] syncAckSetDto (required):
  Future<Response> sendSyncAckWithHttpInfo(SyncAckSetDto syncAckSetDto,) async {
    // ignore: prefer_const_declarations
    final apiPath = r'/sync/ack';

    // ignore: prefer_final_locals
    Object? postBody = syncAckSetDto;

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
  /// * [SyncAckSetDto] syncAckSetDto (required):
  Future<void> sendSyncAck(SyncAckSetDto syncAckSetDto,) async {
    final response = await sendSyncAckWithHttpInfo(syncAckSetDto,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
