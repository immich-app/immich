import 'package:flutter/foundation.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/models/sync/sync_event.model.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:openapi/api.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

final syncApiRepositoryProvider = Provider(
  (ref) => SyncApiRepository(ref.watch(apiServiceProvider).syncApi),
);

class SyncApiRepository extends ApiRepository implements ISyncApiRepository {
  // ignore: unused_field
  final SyncApi _api;

  SyncApiRepository(this._api);

  @override
  Stream<List<SyncEvent>> getChanges(
    SyncStreamDtoTypesEnum type,
  ) async* {
    final batchSize = 1000;
    final serverUrl = Store.get(StoreKey.serverUrl);
    final accessToken = Store.get(StoreKey.accessToken);

    final url = Uri.parse('$serverUrl/sync/stream');
    final client = http.Client();
    final request = http.Request('POST', url);
    final headers = {
      'Content-Type': 'application/json',
      'x-immich-user-token': accessToken,
    };

    request.headers.addAll(headers);
    request.body = json.encode({
      "types": [type],
    });
    String previousChunk = '';
    List<String> lines = [];

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

        yield await compute(_parseSyncReponse, lines);
        lines.clear();
      }
    } finally {
      yield await compute(_parseSyncReponse, lines);
      client.close();
    }
  }

  @override
  Future<void> confirmChanges(
    SyncStreamDtoTypesEnum type,
    String id,
    String timestamp,
  ) async {
    try {
      switch (type) {
        case SyncStreamDtoTypesEnum.asset:
          await _api.ackSync(
            SyncAcknowledgeDto(
              asset: SyncCheckpointDto(id: id, timestamp: timestamp),
            ),
          );
          break;

        case SyncStreamDtoTypesEnum.album:
          await _api.ackSync(
            SyncAcknowledgeDto(
              album: SyncCheckpointDto(id: id, timestamp: timestamp),
            ),
          );

        case SyncStreamDtoTypesEnum.user:
          await _api.ackSync(
            SyncAcknowledgeDto(
              user: SyncCheckpointDto(id: id, timestamp: timestamp),
            ),
          );

        case SyncStreamDtoTypesEnum.partner:
          await _api.ackSync(
            SyncAcknowledgeDto(
              partner: SyncCheckpointDto(id: id, timestamp: timestamp),
            ),
          );
          break;

        default:
          break;
      }
    } catch (error) {
      debugPrint("[acknowledge] Error acknowledging sync $error");
    }
  }

  List<SyncEvent> _parseSyncReponse(
    List<String> lines,
  ) {
    final List<SyncEvent> data = [];

    for (var line in lines) {
      try {
        final type = SyncStreamDtoTypesEnum.fromJson(jsonDecode(line)['type'])!;
        final action = SyncAction.fromJson(jsonDecode(line)['action']);
        final dataJson = jsonDecode(line)['data'];
        final id = jsonDecode(line)['ack']['id'];
        final timestamp = jsonDecode(line)['ack']['timestamp'];

        switch (type) {
          case SyncStreamDtoTypesEnum.asset:
            if (action == SyncAction.upsert) {
              final dto = AssetResponseDto.fromJson(dataJson)!;
              final asset = Asset.remote(dto);

              data.add(
                SyncEvent(
                  type: type,
                  action: SyncAction.upsert,
                  data: asset,
                  id: id,
                  timestamp: timestamp,
                ),
              );
            } else if (action == SyncAction.delete) {
              data.add(
                SyncEvent(
                  type: type,
                  action: SyncAction.delete,
                  data: dataJson.toString(),
                  id: id,
                  timestamp: timestamp,
                ),
              );
            }
            break;

          default:
            break;
        }
      } catch (error) {
        debugPrint("[_parseSyncReponse] Error parsing json $error");
      }
    }

    return data;
  }
}
