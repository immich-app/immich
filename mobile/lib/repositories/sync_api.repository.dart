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
  Stream<Map<SyncStreamDtoTypesEnum, dynamic>> getChanges(
    List<SyncStreamDtoTypesEnum> types,
  ) async* {
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
      "types": types,
    });

    try {
      final response = await client.send(request);
      String previousChunk = '';
      await for (var chunk in response.stream.transform(utf8.decoder)) {
        final isComplete = chunk.endsWith('\n');

        if (isComplete) {
          final jsonString = previousChunk + chunk;
          yield await compute(_parseSyncReponse, jsonString);
          previousChunk = '';
        } else {
          previousChunk += chunk;
        }
      }
    } catch (e, stack) {
      print(stack);
      debugPrint("Error: $e");
    } finally {
      debugPrint("Closing client");
      client.close();
    }
  }

  @override
  Future<void> confirmChages(String changeId) async {
    // TODO: implement confirmChages
    throw UnimplementedError();
  }

  Map<SyncStreamDtoTypesEnum, dynamic> _parseSyncReponse(String jsonString) {
    try {
      jsonString = jsonString.trim();
      final type =
          SyncStreamDtoTypesEnum.fromJson(jsonDecode(jsonString)['type'])!;
      final action = SyncAction.fromJson(jsonDecode(jsonString)['action']);
      final data = jsonDecode(jsonString)['data'];

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
  }
}
