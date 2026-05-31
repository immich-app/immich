// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

class SyncApi {
  SyncApi([ApiClient? apiClient]) : apiClient = apiClient ?? defaultApiClient;

  final ApiClient apiClient;

  static const ApiVersion deleteSyncAckAddedIn = .new(1, 0, 0);

  static const ApiState deleteSyncAckState = .stable;

  static const ApiVersion getSyncAckAddedIn = .new(1, 0, 0);

  static const ApiState getSyncAckState = .stable;

  static const ApiVersion sendSyncAckAddedIn = .new(1, 0, 0);

  static const ApiState sendSyncAckState = .stable;

  static const ApiVersion getSyncStreamAddedIn = .new(1, 0, 0);

  static const ApiState getSyncStreamState = .stable;

  /// Delete acknowledgements
  ///
  /// Delete specific synchronization acknowledgments.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> deleteSyncAckWithHttpInfo(SyncAckDeleteDto syncAckDeleteDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/sync/ack';

    Object? postBody = syncAckDeleteDto;

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    final formParams = <String, String>{};

    const contentTypes = <String>[r'application/json'];

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

  /// Delete acknowledgements
  ///
  /// Delete specific synchronization acknowledgments.
  ///
  /// Available since server v1.0.0.
  Future<void> deleteSyncAck(SyncAckDeleteDto syncAckDeleteDto, {Future<void>? abortTrigger}) async {
    final response = await deleteSyncAckWithHttpInfo(syncAckDeleteDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Retrieve acknowledgements
  ///
  /// Retrieve the synchronization acknowledgments for the current session.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getSyncAckWithHttpInfo({Future<void>? abortTrigger}) async {
    final apiPath = r'/sync/ack';

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

  /// Retrieve acknowledgements
  ///
  /// Retrieve the synchronization acknowledgments for the current session.
  ///
  /// Available since server v1.0.0.
  Future<List<SyncAckDto>> getSyncAck({Future<void>? abortTrigger}) async {
    final response = await getSyncAckWithHttpInfo(abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
    if (response.body.isNotEmpty && response.statusCode != HttpStatus.noContent) {
      final responseBody = await _decodeBodyBytes(response);
      return (await apiClient.deserializeAsync(responseBody, r'List<SyncAckDto>') as List).cast<SyncAckDto>().toList(
        growable: false,
      );
    }
    throw ApiException(response.statusCode, r'Unexpected empty response body');
  }

  /// Acknowledge changes
  ///
  /// Send a list of synchronization acknowledgements to confirm that the latest changes have been received.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> sendSyncAckWithHttpInfo(SyncAckSetDto syncAckSetDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/sync/ack';

    Object? postBody = syncAckSetDto;

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

  /// Acknowledge changes
  ///
  /// Send a list of synchronization acknowledgements to confirm that the latest changes have been received.
  ///
  /// Available since server v1.0.0.
  Future<void> sendSyncAck(SyncAckSetDto syncAckSetDto, {Future<void>? abortTrigger}) async {
    final response = await sendSyncAckWithHttpInfo(syncAckSetDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }

  /// Stream sync changes
  ///
  /// Retrieve a JSON lines streamed response of changes for synchronization. This endpoint is used by the mobile app to efficiently stay up to date with changes.
  ///
  /// Available since server v1.0.0.
  ///
  /// Note: This method returns the HTTP [Response].
  Future<Response> getSyncStreamWithHttpInfo(SyncStreamDto syncStreamDto, {Future<void>? abortTrigger}) async {
    final apiPath = r'/sync/stream';

    Object? postBody = syncStreamDto;

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

  /// Stream sync changes
  ///
  /// Retrieve a JSON lines streamed response of changes for synchronization. This endpoint is used by the mobile app to efficiently stay up to date with changes.
  ///
  /// Available since server v1.0.0.
  Future<void> getSyncStream(SyncStreamDto syncStreamDto, {Future<void>? abortTrigger}) async {
    final response = await getSyncStreamWithHttpInfo(syncStreamDto, abortTrigger: abortTrigger);
    if (response.statusCode >= HttpStatus.badRequest) {
      throw ApiException(response.statusCode, await _decodeBodyBytes(response));
    }
  }
}
