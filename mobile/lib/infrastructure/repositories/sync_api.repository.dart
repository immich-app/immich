import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/sync_event.model.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class SyncApiRepository {
  final Logger _logger = Logger('SyncApiRepository');
  final ApiService _api;
  SyncApiRepository(this._api);

  Future<void> ack(List<String> data) {
    return _api.syncApi.sendSyncAck(SyncAckSetDto(acks: data));
  }

  Future<void> streamChanges(
    Future<void> Function(List<SyncEvent>, Function() abort, Function() reset) onData, {
    Function()? onReset,
    int batchSize = kSyncEventBatchSize,
    http.Client? httpClient,
  }) async {
    final stopwatch = Stopwatch()..start();
    final client = httpClient ?? http.Client();
    final endpoint = "${_api.apiClient.basePath}/sync/stream";

    final headers = {'Content-Type': 'application/json', 'Accept': 'application/jsonlines+json'};

    final headerParams = <String, String>{};
    await _api.applyToParams([], headerParams);
    headers.addAll(headerParams);

    final request = http.Request('POST', Uri.parse(endpoint));
    request.headers.addAll(headers);
    request.body = jsonEncode(
      SyncStreamDto(
        types: [
          SyncRequestType.authUsersV1,
          SyncRequestType.usersV1,
          SyncRequestType.assetsV1,
          SyncRequestType.assetExifsV1,
          SyncRequestType.partnersV1,
          SyncRequestType.partnerAssetsV1,
          SyncRequestType.partnerAssetExifsV1,
          SyncRequestType.albumsV1,
          SyncRequestType.albumUsersV1,
          SyncRequestType.albumAssetsV1,
          SyncRequestType.albumAssetExifsV1,
          SyncRequestType.albumToAssetsV1,
          SyncRequestType.memoriesV1,
          SyncRequestType.memoryToAssetsV1,
          SyncRequestType.stacksV1,
          SyncRequestType.partnerStacksV1,
          SyncRequestType.userMetadataV1,
          SyncRequestType.peopleV1,
          SyncRequestType.assetFacesV1,
        ],
      ).toJson(),
    );

    String previousChunk = '';
    List<String> lines = [];

    bool shouldAbort = false;

    void abort() {
      _logger.warning("Abort requested, stopping sync stream");
      shouldAbort = true;
    }

    final reset = onReset ?? () {};

    try {
      final response = await client.send(request);

      if (response.statusCode != 200) {
        final errorBody = await response.stream.bytesToString();
        throw ApiException(response.statusCode, 'Failed to get sync stream: $errorBody');
      }

      await for (final chunk in response.stream.transform(utf8.decoder)) {
        if (shouldAbort) {
          break;
        }

        previousChunk += chunk;
        final parts = previousChunk.toString().split('\n');
        previousChunk = parts.removeLast();
        lines.addAll(parts);

        if (lines.length < batchSize) {
          continue;
        }

        await onData(_parseLines(lines), abort, reset);
        lines.clear();
      }

      if (lines.isNotEmpty && !shouldAbort) {
        await onData(_parseLines(lines), abort, reset);
      }
    } catch (error, stack) {
      _logger.severe("Error processing stream", error, stack);
      return Future.error(error, stack);
    } finally {
      client.close();
    }
    stopwatch.stop();
    _logger.info("Remote Sync completed in ${stopwatch.elapsed.inMilliseconds}ms");
  }

  List<SyncEvent> _parseLines(List<String> lines) {
    final List<SyncEvent> data = [];

    for (final line in lines) {
      final jsonData = jsonDecode(line);
      final type = SyncEntityType.fromJson(jsonData['type'])!;
      final dataJson = jsonData['data'];
      final ack = jsonData['ack'];
      final converter = _kResponseMap[type];
      if (converter == null) {
        _logger.warning("Unknown type $type");
        continue;
      }

      data.add(SyncEvent(type: type, data: converter(dataJson), ack: ack));
    }

    return data;
  }
}

const _kResponseMap = <SyncEntityType, Function(Object)>{
  SyncEntityType.authUserV1: SyncAuthUserV1.fromJson,
  SyncEntityType.userV1: SyncUserV1.fromJson,
  SyncEntityType.userDeleteV1: SyncUserDeleteV1.fromJson,
  SyncEntityType.partnerV1: SyncPartnerV1.fromJson,
  SyncEntityType.partnerDeleteV1: SyncPartnerDeleteV1.fromJson,
  SyncEntityType.assetV1: SyncAssetV1.fromJson,
  SyncEntityType.assetDeleteV1: SyncAssetDeleteV1.fromJson,
  SyncEntityType.assetExifV1: SyncAssetExifV1.fromJson,
  SyncEntityType.partnerAssetV1: SyncAssetV1.fromJson,
  SyncEntityType.partnerAssetBackfillV1: SyncAssetV1.fromJson,
  SyncEntityType.partnerAssetDeleteV1: SyncAssetDeleteV1.fromJson,
  SyncEntityType.partnerAssetExifV1: SyncAssetExifV1.fromJson,
  SyncEntityType.partnerAssetExifBackfillV1: SyncAssetExifV1.fromJson,
  SyncEntityType.albumV1: SyncAlbumV1.fromJson,
  SyncEntityType.albumDeleteV1: SyncAlbumDeleteV1.fromJson,
  SyncEntityType.albumUserV1: SyncAlbumUserV1.fromJson,
  SyncEntityType.albumUserBackfillV1: SyncAlbumUserV1.fromJson,
  SyncEntityType.albumUserDeleteV1: SyncAlbumUserDeleteV1.fromJson,
  SyncEntityType.albumAssetCreateV1: SyncAssetV1.fromJson,
  SyncEntityType.albumAssetUpdateV1: SyncAssetV1.fromJson,
  SyncEntityType.albumAssetBackfillV1: SyncAssetV1.fromJson,
  SyncEntityType.albumAssetExifCreateV1: SyncAssetExifV1.fromJson,
  SyncEntityType.albumAssetExifUpdateV1: SyncAssetExifV1.fromJson,
  SyncEntityType.albumAssetExifBackfillV1: SyncAssetExifV1.fromJson,
  SyncEntityType.albumToAssetV1: SyncAlbumToAssetV1.fromJson,
  SyncEntityType.albumToAssetBackfillV1: SyncAlbumToAssetV1.fromJson,
  SyncEntityType.albumToAssetDeleteV1: SyncAlbumToAssetDeleteV1.fromJson,
  SyncEntityType.syncAckV1: _SyncEmptyDto.fromJson,
  SyncEntityType.syncResetV1: _SyncEmptyDto.fromJson,
  SyncEntityType.memoryV1: SyncMemoryV1.fromJson,
  SyncEntityType.memoryDeleteV1: SyncMemoryDeleteV1.fromJson,
  SyncEntityType.memoryToAssetV1: SyncMemoryAssetV1.fromJson,
  SyncEntityType.memoryToAssetDeleteV1: SyncMemoryAssetDeleteV1.fromJson,
  SyncEntityType.stackV1: SyncStackV1.fromJson,
  SyncEntityType.stackDeleteV1: SyncStackDeleteV1.fromJson,
  SyncEntityType.partnerStackV1: SyncStackV1.fromJson,
  SyncEntityType.partnerStackBackfillV1: SyncStackV1.fromJson,
  SyncEntityType.partnerStackDeleteV1: SyncStackDeleteV1.fromJson,
  SyncEntityType.userMetadataV1: SyncUserMetadataV1.fromJson,
  SyncEntityType.userMetadataDeleteV1: SyncUserMetadataDeleteV1.fromJson,
  SyncEntityType.personV1: SyncPersonV1.fromJson,
  SyncEntityType.personDeleteV1: SyncPersonDeleteV1.fromJson,
  SyncEntityType.assetFaceV1: SyncAssetFaceV1.fromJson,
  SyncEntityType.assetFaceDeleteV1: SyncAssetFaceDeleteV1.fromJson,
  SyncEntityType.syncCompleteV1: _SyncEmptyDto.fromJson,
};

class _SyncEmptyDto {
  static _SyncEmptyDto? fromJson(dynamic _) => _SyncEmptyDto();
}
