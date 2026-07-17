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

  /// Delete acknowledgements
  ///
  /// Delete specific synchronization acknowledgments.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [SyncAckDeleteDto] syncAckDeleteDto (required):
  Future<Response> deleteSyncAckWithHttpInfo(SyncAckDeleteDto syncAckDeleteDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Delete acknowledgements
  ///
  /// Delete specific synchronization acknowledgments.
  ///
  /// Parameters:
  ///
  /// * [SyncAckDeleteDto] syncAckDeleteDto (required):
  Future<void> deleteSyncAck(SyncAckDeleteDto syncAckDeleteDto, { Future<void>? abortTrigger, }) async {
    final response = await deleteSyncAckWithHttpInfo(syncAckDeleteDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve acknowledgements
  ///
  /// Retrieve the synchronization acknowledgments for the current session.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getSyncAckWithHttpInfo({ Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Retrieve acknowledgements
  ///
  /// Retrieve the synchronization acknowledgments for the current session.
  Future<List<SyncAckDto>?> getSyncAck({ Future<void>? abortTrigger, }) async {
    final response = await getSyncAckWithHttpInfo(abortTrigger: abortTrigger,);
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

  /// Stream sync changes
  ///
  /// Retrieve a JSON lines streamed response of changes for synchronization. This endpoint is used by the mobile app to efficiently stay up to date with changes.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [SyncStreamDto] syncStreamDto (required):
  Future<Response> getSyncStreamWithHttpInfo(SyncStreamDto syncStreamDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Stream sync changes
  ///
  /// Retrieve a JSON lines streamed response of changes for synchronization. This endpoint is used by the mobile app to efficiently stay up to date with changes.
  ///
  /// Parameters:
  ///
  /// * [SyncStreamDto] syncStreamDto (required):
  Future<void> getSyncStream(SyncStreamDto syncStreamDto, { Future<void>? abortTrigger, }) async {
    final response = await getSyncStreamWithHttpInfo(syncStreamDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Acknowledge changes
  ///
  /// Send a list of synchronization acknowledgements to confirm that the latest changes have been received.
  ///
  /// Note: This method returns the HTTP [Response].
  ///
  /// Parameters:
  ///
  /// * [SyncAckSetDto] syncAckSetDto (required):
  Future<Response> sendSyncAckWithHttpInfo(SyncAckSetDto syncAckSetDto, { Future<void>? abortTrigger, }) async {
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
      abortTrigger: abortTrigger,
    );
  }

  /// Acknowledge changes
  ///
  /// Send a list of synchronization acknowledgements to confirm that the latest changes have been received.
  ///
  /// Parameters:
  ///
  /// * [SyncAckSetDto] syncAckSetDto (required):
  Future<void> sendSyncAck(SyncAckSetDto syncAckSetDto, { Future<void>? abortTrigger, }) async {
    final response = await sendSyncAckWithHttpInfo(syncAckSetDto, abortTrigger: abortTrigger,);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
