import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:http/http.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/models/sync/sync_event.model.dart';
import 'package:immich_mobile/models/sync/sync_user.model.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';
import 'package:http/http.dart' as http;
import 'package:openapi/api.dart';

final syncApiRepositoryProvider = Provider(
  (ref) => SyncApiRepository(
    ref.watch(dbProvider),
  ),
);

class SyncApiRepository extends DatabaseRepository
    implements ISyncApiRepository {
  SyncApiRepository(super.db);

  @override
  Future<void> getUsers() async {
    final timer = Stopwatch()..start();
    final batchSize = 100;
    String previousChunk = '';
    List<String> lines = [];

    final client = http.Client();
    final request =
        _getRequest([SyncRequestType.usersV1, SyncRequestType.usersV1]);
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

        await compute(_parseSyncReponse, lines);
        lines.clear();
      }
    } finally {
      await compute(_parseSyncReponse, lines);
      client.close();

      timer.stop();
      debugPrint(
        "[SyncApiRepository.getUsers] Elapsed time: ${timer.elapsedMilliseconds}ms",
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
}

// Need to be outside of the class to be able to use compute
List<SyncEvent> _parseSyncReponse(
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
              syncType: SyncTypeEnum.user,
              data: SyncUserResponse.fromMap(dataJson),
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
