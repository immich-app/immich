import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/domain/models/sync_event.model.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class SyncApiRepository implements ISyncApiRepository {
  final Logger _logger = Logger('SyncApiRepository');
  final ApiService _api;
  SyncApiRepository(this._api);

  @override
  Future<void> ack(List<String> data) {
    return _api.syncApi.sendSyncAck(SyncAckSetDto(acks: data));
  }

  @override
  Future<void> streamChanges(
    Function(List<SyncEvent>, Function() abort) onData, {
    int batchSize = kSyncEventBatchSize,
    http.Client? httpClient,
  }) async {
    // ignore: avoid-unused-assignment
    final stopwatch = Stopwatch()..start();
    final client = httpClient ?? http.Client();
    final endpoint = "${_api.apiClient.basePath}/sync/stream";

    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/jsonlines+json',
    };

    final headerParams = <String, String>{};
    await _api.applyToParams([], headerParams);
    headers.addAll(headerParams);

    final request = http.Request('POST', Uri.parse(endpoint));
    request.headers.addAll(headers);
    request.body = jsonEncode(
      SyncStreamDto(
        types: [
          SyncRequestType.usersV1,
          SyncRequestType.partnersV1,
          SyncRequestType.assetsV1,
          SyncRequestType.partnerAssetsV1,
          SyncRequestType.assetExifsV1,
          SyncRequestType.partnerAssetExifsV1,
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

    try {
      final response =
          await client.send(request).timeout(const Duration(seconds: 20));

      if (response.statusCode != 200) {
        final errorBody = await response.stream.bytesToString();
        throw ApiException(
          response.statusCode,
          'Failed to get sync stream: $errorBody',
        );
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

        await onData(_parseLines(lines), abort);
        lines.clear();
      }

      if (lines.isNotEmpty && !shouldAbort) {
        await onData(_parseLines(lines), abort);
      }
    } catch (error, stack) {
      _logger.severe("error processing stream", error, stack);
      return Future.error(error, stack);
    } finally {
      client.close();
    }
    stopwatch.stop();
    _logger
        .info("Remote Sync completed in ${stopwatch.elapsed.inMilliseconds}ms");
  }

  List<SyncEvent> _parseLines(List<String> lines) {
    final List<SyncEvent> data = [];

    for (final line in lines) {
      try {
        final jsonData = jsonDecode(line);
        final type = SyncEntityType.fromJson(jsonData['type'])!;
        final dataJson = jsonData['data'];
        final ack = jsonData['ack'];
        final converter = _kResponseMap[type];
        if (converter == null) {
          _logger.warning("[_parseSyncResponse] Unknown type $type");
          continue;
        }

        data.add(SyncEvent(type: type, data: converter(dataJson), ack: ack));
      } catch (error, stack) {
        _logger.severe("[_parseSyncResponse] Error parsing json", error, stack);
      }
    }

    return data;
  }
}

// ignore: avoid-dynamic
const _kResponseMap = <SyncEntityType, Function(dynamic)>{
  SyncEntityType.userV1: SyncUserV1.fromJson,
  SyncEntityType.userDeleteV1: SyncUserDeleteV1.fromJson,
  SyncEntityType.partnerV1: SyncPartnerV1.fromJson,
  SyncEntityType.partnerDeleteV1: SyncPartnerDeleteV1.fromJson,
  SyncEntityType.assetV1: SyncAssetV1.fromJson,
  SyncEntityType.assetDeleteV1: SyncAssetDeleteV1.fromJson,
  SyncEntityType.assetExifV1: SyncAssetExifV1.fromJson,
  SyncEntityType.partnerAssetV1: SyncAssetV1.fromJson,
  SyncEntityType.partnerAssetDeleteV1: SyncAssetDeleteV1.fromJson,
  SyncEntityType.partnerAssetExifV1: SyncAssetExifV1.fromJson,
};
