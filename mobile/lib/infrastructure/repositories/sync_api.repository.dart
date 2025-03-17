import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/domain/models/sync/sync_event.model.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

class SyncApiRepository implements ISyncApiRepository {
  final Logger _logger = Logger('SyncApiRepository');
  final ApiService _api;
  SyncApiRepository(this._api);

  @override
  Stream<List<SyncEvent>> getSyncEvents(List<SyncRequestType> type) {
    return _getSyncStream(SyncStreamDto(types: type));
  }

  @override
  Future<void> ack(List<String> data) {
    return _api.syncApi.sendSyncAck(SyncAckSetDto(acks: data));
  }

  Stream<List<SyncEvent>> _getSyncStream(
    SyncStreamDto dto, {
    int batchSize = 5000,
  }) async* {
    final client = http.Client();
    final endpoint = "${_api.apiClient.basePath}/sync/stream";

    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/jsonlines+json',
    };

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    await _api.applyToParams(queryParams, headerParams);
    headers.addAll(headerParams);

    final request = http.Request('POST', Uri.parse(endpoint));
    request.headers.addAll(headers);
    request.body = jsonEncode(dto.toJson());

    String previousChunk = '';
    List<String> lines = [];

    try {
      final response = await client.send(request);

      if (response.statusCode != 200) {
        final errorBody = await response.stream.bytesToString();
        throw ApiException(
          response.statusCode,
          'Failed to get sync stream: $errorBody',
        );
      }

      await for (final chunk in response.stream.transform(utf8.decoder)) {
        previousChunk += chunk;
        // ignore: move-variable-outside-iteration
        final parts = previousChunk.toString().split('\n');
        previousChunk = parts.removeLast();
        lines.addAll(parts);

        if (lines.length < batchSize) {
          continue;
        }

        yield _parseSyncResponse(lines);
        lines.clear();
      }
    } finally {
      if (lines.isNotEmpty) {
        yield _parseSyncResponse(lines);
      }
      client.close();
    }
  }

  List<SyncEvent> _parseSyncResponse(List<String> lines) {
    final List<SyncEvent> data = [];

    for (final line in lines) {
      try {
        final jsonData = jsonDecode(line);
        final type = SyncEntityType.fromJson(jsonData['type'])!;
        final dataJson = jsonData['data'];
        final ack = jsonData['ack'];
        final converter = _kResponseMap[type];
        if (converter == null) {
          _logger.warning("[_parseSyncReponse] Unknown type $type");
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
};
