import 'package:flutter/foundation.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/interfaces/sync_api.interface.dart';
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
  Stream<List<Map<SyncStreamDtoTypesEnum, dynamic>>> getChanges(
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
    } catch (error, stack) {
      debugPrint("[getChanges] Error getChangeStream $error $stack");
    } finally {
      yield await compute(_parseSyncReponse, lines);
      client.close();
    }
  }

  @override
  Future<void> confirmChages(String changeId) async {
    // TODO: implement confirmChages
    throw UnimplementedError();
  }

  List<Map<SyncStreamDtoTypesEnum, dynamic>> _parseSyncReponse(
    List<String> lines,
  ) {
    final data = lines.map<Map<SyncStreamDtoTypesEnum, dynamic>>((line) {
      try {
        final type = SyncStreamDtoTypesEnum.fromJson(jsonDecode(line)['type'])!;
        final action = SyncAction.fromJson(jsonDecode(line)['action']);
        final data = jsonDecode(line)['data'];

        switch (type) {
          case SyncStreamDtoTypesEnum.asset:
            if (action == SyncAction.upsert) {
              final dto = AssetResponseDto.fromJson(data);
              if (dto == null) {
                return {};
              }

              final asset = Asset.remote(dto);
              return {type: asset};
            }

            // Data is the id of the asset if type is delete
            if (action == SyncAction.delete) {
              return {type: data};
            }

          default:
            return {};
        }

        return {};
      } catch (error) {
        debugPrint("[_parseSyncReponse] Error parsing json $error");
        return {};
      }
    });

    return data.toList();
  }
}
