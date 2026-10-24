import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:immich_mobile/repositories/locked_album_media.repository.dart';
import 'package:openapi/api.dart';

void main() {
  test('thumbnail bytes use authenticated API and request no persistent cache', () async {
    final client = ApiClient(basePath: 'https://synthetic.invalid/api');
    client.addDefaultHeader('Authorization', 'Bearer synthetic');
    client.client = MockClient((request) async {
      expect(request.method, 'GET');
      expect(request.url.path, '/api/assets/synthetic/thumbnail');
      expect(request.url.queryParameters['size'], 'thumbnail');
      expect(request.headers['Authorization'], 'Bearer synthetic');
      expect(request.headers['Cache-Control'], 'no-store');
      return http.Response.bytes([1, 2, 3], 200);
    });
    final repository = LockedAlbumMediaRepository(client, list: (_, _) async => [], get: (_) async => null);
    expect(await repository.thumbnail('synthetic'), [1, 2, 3]);
  });

  test('preview errors contain no server body or private path', () async {
    final client = ApiClient(basePath: 'https://synthetic.invalid/api');
    client.client = MockClient((_) async => http.Response('sensitive server body', 403));
    final repository = LockedAlbumMediaRepository(client, list: (_, _) async => [], get: (_) async => null);
    await expectLater(
      repository.thumbnail('synthetic'),
      throwsA(
        isA<ApiException>()
            .having((e) => e.code, 'code', 403)
            .having((e) => e.message, 'message', 'Private preview unavailable'),
      ),
    );
  });
}
