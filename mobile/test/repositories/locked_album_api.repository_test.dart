import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:immich_mobile/domain/models/locked_album.model.dart';
import 'package:immich_mobile/repositories/locked_album_api.repository.dart';
import 'package:openapi/api.dart';

const _id = '00000000-0000-4000-8000-000000000001';
const _assetId = '00000000-0000-4000-8000-000000000002';
final _albumJson = <String, dynamic>{
  'id': _id,
  'albumName': 'Synthetic group',
  'createdAt': '2026-01-01T00:00:00.000Z',
  'updatedAt': '2026-01-02T00:00:00.000Z',
  'assetCount': 1,
};

void main() {
  test('models parse the experimental contract without an ordinary album DTO', () {
    final album = LockedAlbum.fromJson(_albumJson);
    expect(album.id, _id);
    expect(album.assetCount, 1);
    expect(album.createdAt.isUtc, isTrue);
    final page = LockedAlbumAssetPage.fromJson({
      'assetIds': [_assetId],
      'hasNextPage': true,
    });
    expect(page.hasNextPage, isTrue);
    expect(() => page.assetIds.add(_id), throwsUnsupportedError);
  });

  test('reads both authoritative expiration dates through raw authenticated auth status', () async {
    final client = ApiClient(basePath: 'https://synthetic.invalid/api');
    client.addDefaultHeader('Authorization', 'Bearer synthetic');
    client.client = MockClient((request) async {
      expect(request.method, 'GET');
      expect(request.url.path, '/api/auth/status');
      expect(request.headers['Authorization'], 'Bearer synthetic');
      return http.Response(
        jsonEncode({
          'isElevated': true,
          'expiresAt': '2026-01-01T00:30:00.000Z',
          'pinExpiresAt': '2026-01-01T00:15:00.000Z',
        }),
        200,
      );
    });
    final access = await LockedAlbumApiRepository(client).getAccess();
    expect(access.isElevated, isTrue);
    expect(access.expiresAt, DateTime.utc(2026, 1, 1, 0, 30));
    expect(access.pinExpiresAt, DateTime.utc(2026, 1, 1, 0, 15));
    expect(access.deadline, access.pinExpiresAt);
  });

  test('raw status rejects missing and invalid deadlines', () async {
    for (final deadline in [null, '', 'invalid', '2026-02-30T00:00:00.000Z']) {
      final client = ApiClient(basePath: 'https://synthetic.invalid/api');
      client.client = MockClient(
        (_) async => http.Response(
          jsonEncode({'isElevated': true, 'expiresAt': '2026-01-01T00:30:00.000Z', 'pinExpiresAt': deadline}),
          200,
        ),
      );
      await expectLater(LockedAlbumApiRepository(client).getAccess(), throwsFormatException);
    }
  });

  test('uses authenticated /locked-albums routes and exact membership payloads', () async {
    final requests = <http.Request>[];
    final client = ApiClient(basePath: 'https://synthetic.invalid/api');
    client.addDefaultHeader('Authorization', 'Bearer synthetic');
    client.client = MockClient((request) async {
      requests.add(request);
      expect(request.headers['Authorization'], 'Bearer synthetic');
      expect(request.url.path, startsWith('/api/locked-albums'));
      if (request.url.path.endsWith('/assets')) {
        if (request.method == 'GET') {
          return http.Response(
            jsonEncode({
              'assetIds': [_assetId],
              'hasNextPage': false,
            }),
            200,
          );
        }
        return http.Response('', 204);
      }
      if (request.method == 'DELETE') {
        return http.Response('', 204);
      }
      final data = request.method == 'GET' && request.url.path == '/api/locked-albums' ? [_albumJson] : _albumJson;
      return http.Response(jsonEncode(data), 200);
    });
    final repository = LockedAlbumApiRepository(client);
    expect((await repository.getAll()).single.id, _id);
    expect((await repository.get(_id)).albumName, 'Synthetic group');
    await repository.create('  Synthetic group  ');
    expect(jsonDecode(requests.last.body), {'albumName': 'Synthetic group'});
    expect(requests.last.method, 'POST');
    await repository.rename(_id, ' Renamed ');
    expect(jsonDecode(requests.last.body), {'albumName': 'Renamed'});
    expect(requests.last.method, 'PATCH');
    final page = await repository.getAssets(_id, skip: 50, take: 100);
    expect(page.assetIds, [_assetId]);
    expect(requests.last.url.queryParameters, {'skip': '50', 'take': '100'});
    await repository.addAssets(_id, [_assetId]);
    expect(requests.last.method, 'PUT');
    expect(jsonDecode(requests.last.body), {
      'ids': [_assetId],
    });
    await repository.removeAssets(_id, [_assetId]);
    expect(requests.last.method, 'DELETE');
    expect(jsonDecode(requests.last.body), {
      'ids': [_assetId],
    });
    await repository.delete(_id);
    expect(requests.last.url.path, '/api/locked-albums/$_id');
    expect(requests.last.method, 'DELETE');
  });

  test('validates bounds before making requests and does not leak error bodies', () async {
    var count = 0;
    final client = ApiClient(basePath: 'https://synthetic.invalid/api');
    client.client = MockClient((_) async {
      count++;
      return http.Response('private response must not escape', 403);
    });
    final repository = LockedAlbumApiRepository(client);
    await expectLater(repository.create('  '), throwsArgumentError);
    await expectLater(repository.create('x' * 256), throwsArgumentError);
    await expectLater(repository.getAssets(_id, take: 101), throwsArgumentError);
    await expectLater(repository.getAssets(_id, skip: -1), throwsArgumentError);
    await expectLater(repository.addAssets(_id, List.filled(101, _assetId)), throwsArgumentError);
    await expectLater(repository.addAssets(_id, ['not-a-uuid']), throwsArgumentError);
    await expectLater(repository.removeAssets(_id, []), throwsArgumentError);
    expect(count, 0);
    await expectLater(
      repository.getAll(),
      throwsA(
        isA<ApiException>()
            .having((error) => error.code, 'code', 403)
            .having((error) => error.message, 'message', 'Locked group request failed'),
      ),
    );
    expect(count, 1);
  });
}
