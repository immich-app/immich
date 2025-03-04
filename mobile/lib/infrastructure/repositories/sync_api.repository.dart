import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/domain/models/sync/sync_event.model.dart';
import 'package:immich_mobile/domain/models/sync/sync_user_delete.model.dart';
import 'package:immich_mobile/domain/models/sync/sync_user_update.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:http/http.dart' as http;
import 'package:openapi/api.dart';

final syncApiRepositoryProvider = Provider(
  (ref) => SyncApiRepository(
    ref.watch(dbProvider),
    ref.watch(apiServiceProvider).syncApi,
  ),
);

class SyncApiRepository extends DatabaseRepository
    implements ISyncApiRepository {
  final SyncApi _syncApi;
  SyncApiRepository(super.db, this._syncApi);

  @override
  Stream<List<SyncEvent>> watchUserSyncEvent() {
    return _streamSync(
      types: [SyncRequestType.usersV1],
      methodName: 'watchUserSyncEvent',
    );
  }

  Stream<List<SyncEvent>> _streamSync({
    required List<SyncRequestType> types,
    required String methodName,
    int batchSize = 5000,
  }) async* {
    final timer = Stopwatch()..start();
    String previousChunk = '';
    List<String> lines = [];

    final client = http.Client();
    final request = _getRequest(types);
    if (request == null) {
      return;
    }

    try {
      final response = await client.send(request);

      await for (var chunk in response.stream.transform(utf8.decoder)) {
        previousChunk += chunk;
        final parts = previousChunk.split('\n');
        previousChunk = parts.removeLast();
        lines.addAll(parts);

        if (lines.length < batchSize) {
          continue;
        }

        final events = await compute(_parseSyncResponse, lines);
        yield events;
        lines.clear();
      }
    } finally {
      if (lines.isNotEmpty) {
        final events = await compute(_parseSyncResponse, lines);
        yield events;
      }
      client.close();

      timer.stop();
      debugPrint(
        "[SyncApiRepository.$methodName] Elapsed time: ${timer.elapsedMilliseconds}ms",
      );
    }
  }

  Request? _getRequest(List<SyncRequestType> types) {
    final serverUrl = Store.tryGet(StoreKey.serverUrl);
    final accessToken = Store.tryGet(StoreKey.accessToken);
    if (serverUrl == null || accessToken == null) {
      return null;
    }

    final url = Uri.parse('$serverUrl/sync/stream');
    final request = http.Request('POST', url);
    final headers = {
      'Content-Type': 'application/json',
      'x-immich-user-token': accessToken,
    };

    request.headers.addAll(headers);
    request.body = json.encode({
      "types": [...types],
    });

    return request;
  }

  @override
  Future<void> ack(String data) {
    return _syncApi.sendSyncAck(SyncAckSetDto(acks: [data]));
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
