import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/domain/models/sync/sync_event.model.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:openapi/api.dart';
import 'package:http/http.dart' as http;

class SyncApiRepository implements ISyncApiRepository {
  final ApiService _api;
  const SyncApiRepository(this._api);

  @override
  Stream<List<SyncEvent>> watchUserSyncEvent() {
    return _getSyncStream(
      SyncStreamDto(types: [SyncRequestType.usersV1]),
    );
  }

  @override
  Future<void> ack(String data) {
    return _api.syncApi.sendSyncAck(SyncAckSetDto(acks: [data]));
  }

  Stream<List<SyncEvent>> _getSyncStream(
    SyncStreamDto dto, {
    int batchSize = 5000,
  }) async* {
    final client = http.Client();
    final endpoint = "${_api.apiClient.basePath}/sync/stream";

    final headers = <String, String>{
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
        final parts = previousChunk.split('\n');
        previousChunk = parts.removeLast();
        lines.addAll(parts);

        if (lines.length < batchSize) {
          continue;
        }

        yield await compute(_parseSyncResponse, lines);
        lines.clear();
      }
    } finally {
      if (lines.isNotEmpty) {
        yield await compute(_parseSyncResponse, lines);
      }
      client.close();
    }
  }
}

const _kResponseMap = <SyncEntityType, Function(dynamic)>{
  SyncEntityType.userV1: SyncUserV1.fromJson,
  SyncEntityType.userDeleteV1: SyncUserDeleteV1.fromJson,
};

// Need to be outside of the class to be able to use compute
List<SyncEvent> _parseSyncResponse(List<String> lines) {
  final List<SyncEvent> data = [];

  for (var line in lines) {
    try {
      final jsonData = jsonDecode(line);
      final type = SyncEntityType.fromJson(jsonData['type'])!;
      final dataJson = jsonData['data'];
      final ack = jsonData['ack'];
      final converter = _kResponseMap[type];
      if (converter == null) {
        debugPrint("[_parseSyncReponse] Unknown type $type");
        continue;
      }

      data.add(SyncEvent(data: converter(dataJson), ack: ack));
    } catch (error, stack) {
      debugPrint("[_parseSyncReponse] Error parsing json $error $stack");
    }
  }

  return data;
}
