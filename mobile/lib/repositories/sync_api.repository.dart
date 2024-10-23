import 'package:flutter/material.dart';
import 'package:immich_mobile/entities/store.entity.dart';
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
    print("serverUrl: $serverUrl");
    print("accessToken: $accessToken");

    final url = Uri.parse('$serverUrl/sync');
    final client = http.Client();

    try {
      final request = http.Request('POST', url);
      request.headers['x-immich-user-token'] = accessToken;
      final payload = {
        'types': ["asset"],
      };
      request.body = jsonEncode(payload);
      final response = await client.send(request);

      // Read and print the chunks from the response stream
      await for (var chunk in response.stream.transform(utf8.decoder)) {
        // Process each chunk as it is received
        print("chunk: $chunk");
        yield chunk;
      }
    } catch (e) {
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
}
