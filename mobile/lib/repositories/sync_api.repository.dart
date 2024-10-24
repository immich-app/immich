import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
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
  Stream<String> getChanges() async* {
    final serverUrl = Store.get(StoreKey.serverUrl);
    final accessToken = Store.get(StoreKey.accessToken);

    final url = Uri.parse('$serverUrl/sync');
    final client = http.Client();
    final request = http.Request('POST', url);

    request.headers['x-immich-user-token'] = accessToken;
    request.body = jsonEncode({
      'types': ["asset"],
    });

    try {
      final response = await client.send(request);

      await for (var chunk in response.stream.transform(utf8.decoder)) {
        // final data = await compute(_parseSyncReponse, chunk);
        final data = _parseSyncReponse(chunk);
        print("Data: $data");
        yield chunk;
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

  Map<String, dynamic> _parseSyncReponse(String jsonString) {
    final type = jsonDecode(jsonString)['type'];
    final data = jsonDecode(jsonString)['data'];
    final action = jsonDecode(jsonString)['action'];

    switch (type) {
      case 'asset':
        if (action == 'upsert') {
          return {type: AssetResponseDto.fromJson(data)};
        }

        if (action == 'delete') {
          return {type: data};
        }

      case 'album':
        final dto = AlbumResponseDto.fromJson(data);
        if (dto == null) {
          return {};
        }

        final album = Album.remote(dto);
        return {type: album};

      case 'albumAsset': //AlbumAssetResponseDto
        // final dto = AlbumAssetResponseDto.fromJson(data);
        // final album = Album.remote(dto!);
        break;

      case 'user':
        final dto = UserResponseDto.fromJson(data);
        if (dto == null) {
          return {};
        }

        final user = User.fromSimpleUserDto(dto);
        return {type: user};

      case 'partner':
        final dto = PartnerResponseDto.fromJson(data);
        if (dto == null) {
          return {};
        }

        final partner = User.fromPartnerDto(dto);
        return {type: partner};
    }

    return {"invalid": null};
  }
}
