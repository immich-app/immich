import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:immich_mobile/data/server/passkey.dart';
import 'package:immich_mobile/domain/models/passkey.model.dart';
import 'package:openapi/api.dart';

void main() {
  test('getConfig gives the origin of the passkey domain, else of the server URL', () async {
    late Map<String, Object?> passkey;
    final apiClient = ApiClient(basePath: 'http://192.168.1.2:2283/api')
      ..client = MockClient(
        (_) async => http.Response(
          jsonEncode({
            'ffmpeg': {
              'realtime': {'enabled': false},
            },
            'map': {'darkStyle': '', 'enabled': false, 'lightStyle': ''},
            'oauth': {'autoLaunch': false, 'buttonText': 'Login with OAuth', 'enabled': false},
            'passkey': passkey,
            'passwordLogin': {'enabled': true},
            'server': {'loginPageMessage': ''},
          }),
          200,
        ),
      );
    final sut = PasskeyApiRepository(PasskeysApi(apiClient), ConfigPublicApi(apiClient), AuthenticationApi(apiClient));

    passkey = {'enabled': true, 'domain': 'https://photos.example.com:8443/'};
    expect(await sut.getConfig(), (enabled: true, origin: 'https://photos.example.com:8443'));
    passkey = {'enabled': true, 'domain': null};
    expect(await sut.getConfig(), (enabled: true, origin: 'http://192.168.1.2:2283'));
    passkey = {'enabled': true};
    expect(await sut.getConfig(), (enabled: true, origin: 'http://192.168.1.2:2283'));
  });

  test('exchangeCode sends the code and its verifier to the server', () async {
    const login = {
      'accessToken': 'token',
      'isAdmin': false,
      'isOnboarded': true,
      'name': 'user',
      'profileImagePath': '',
      'shouldChangePassword': false,
      'userEmail': 'user@immich.app',
      'userId': 'user-id',
    };
    late http.Request sent;
    final apiClient = ApiClient(basePath: 'https://demo.immich.app/api')
      ..client = MockClient((request) async {
        sent = request;
        return http.Response(jsonEncode(login), 201);
      });
    final sut = PasskeyApiRepository(PasskeysApi(apiClient), ConfigPublicApi(apiClient), AuthenticationApi(apiClient));

    expect((await sut.exchangeCode('code', 'verifier')).accessToken, 'token');
    expect(sent.url.path, '/api/auth/exchange');
    expect(jsonDecode(sent.body), {'code': 'code', 'codeVerifier': 'verifier'});
  });

  test('getAll maps passkeys with and without a name and a last use', () async {
    const passkeys = [
      {
        'id': 'used',
        'name': 'Google Password Manager',
        'createdAt': '2026-10-27T06:34:31.000Z',
        'updatedAt': '2026-10-27T06:34:31.000Z',
        'usedAt': '2026-10-27T06:34:45.000Z',
      },
      {
        'id': 'new',
        'name': null,
        'createdAt': '2026-10-27T06:40:00.000Z',
        'updatedAt': '2026-10-27T06:40:00.000Z',
        'usedAt': null,
      },
    ];
    final apiClient = ApiClient(basePath: 'https://demo.immich.app/api')
      ..client = MockClient((_) async => http.Response(jsonEncode(passkeys), 200));
    final sut = PasskeyApiRepository(PasskeysApi(apiClient), ConfigPublicApi(apiClient), AuthenticationApi(apiClient));

    expect(await sut.getAll(), [
      Passkey(
        id: 'used',
        createdAt: DateTime.utc(2026, 10, 27, 6, 34, 31),
        name: 'Google Password Manager',
        usedAt: DateTime.utc(2026, 10, 27, 6, 34, 45),
      ),
      Passkey(id: 'new', createdAt: DateTime.utc(2026, 10, 27, 6, 40)),
    ]);
  });

  test('update sends the new name, and null to clear it', () async {
    final bodies = <Object?>[];
    final apiClient = ApiClient(basePath: 'https://demo.immich.app/api')
      ..client = MockClient((request) async {
        bodies.add(jsonDecode(request.body));
        return http.Response(
          jsonEncode({
            'id': 'passkey-id',
            'name': null,
            'createdAt': '2026-10-27T06:34:31.000Z',
            'updatedAt': '2026-10-27T06:34:31.000Z',
            'usedAt': null,
          }),
          200,
        );
      });
    final sut = PasskeyApiRepository(PasskeysApi(apiClient), ConfigPublicApi(apiClient), AuthenticationApi(apiClient));

    await sut.update('passkey-id', 'Laptop');
    await sut.update('passkey-id', null);

    expect(bodies, [
      {'name': 'Laptop'},
      {'name': null},
    ]);
  });

  test('delete accepts the empty answer of the server', () async {
    late http.Request sent;
    final apiClient = ApiClient(basePath: 'https://demo.immich.app/api')
      ..client = MockClient((request) async {
        sent = request;
        return http.Response('', 204);
      });
    final sut = PasskeyApiRepository(PasskeysApi(apiClient), ConfigPublicApi(apiClient), AuthenticationApi(apiClient));

    await sut.delete('passkey-id');

    expect((sent.method, sent.url.path), ('DELETE', '/api/passkeys/passkey-id'));
  });
}
