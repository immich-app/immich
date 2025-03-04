import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:immich_mobile/domain/models/sync/sync_event.model.dart';
import 'package:immich_mobile/domain/models/sync/sync_user_delete.model.dart';
import 'package:immich_mobile/domain/models/sync/sync_user_update.model.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:openapi/api.dart';
import 'package:http/http.dart' as http;

extension SyncApiServiceExtension on ApiService {
  Stream<List<SyncEvent>> getSyncStream(
    SyncStreamDto dto, {
    int batchSize = 1000,
  }) async* {
    final client = http.Client();
    final endpoint = "${apiClient.basePath}/sync/stream";

    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/jsonlines+json',
    };

    final queryParams = <QueryParam>[];
    final headerParams = <String, String>{};
    await applyToParams(queryParams, headerParams);
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

      await for (var chunk in response.stream.transform(utf8.decoder)) {
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

// Need to be outside of the class to be able to use compute
List<SyncEvent> _parseSyncResponse(
  List<String> lines,
) {
  final List<SyncEvent> data = [];

  for (var line in lines) {
    try {
      final jsonData = jsonDecode(line);
      final type = SyncEntityType.fromJson(jsonData['type'])!;
      final dataJson = jsonData['data'];
      final ack = jsonData['ack'];

      switch (type) {
        case SyncEntityType.userV1:
          data.add(
            SyncEvent(
              data: SyncUserUpdateResponse.fromMap(dataJson),
              ack: ack,
            ),
          );
          break;
        case SyncEntityType.userDeleteV1:
          data.add(
            SyncEvent(
              data: SyncUserDeleteResponse.fromMap(dataJson),
              ack: ack,
            ),
          );
          break;
        default:
          debugPrint("[_parseSyncReponse] Unknown type $type");
      }
    } catch (error, stack) {
      debugPrint("[_parseSyncReponse] Error parsing json $error $stack");
    }
  }

  return data;
}
