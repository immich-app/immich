import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:immich_mobile/data/server/passkey.dart';
import 'package:immich_mobile/domain/models/passkey.model.dart';
import 'package:openapi/api.dart';

void main() {
  test('startRegistration sends the server origin and decodes the Map<String, Object?> answer', () async {
    const options = {
      'challenge': 'challenge',
      'rp': {'name': 'Immich', 'id': 'my.immich.app'},
      'timeout': 60000,
    };
    late http.Request sent;
    final apiClient = ApiClient(basePath: 'https://demo.immich.app/api')
      ..client = MockClient((request) async {
        sent = request;
        return http.Response(jsonEncode(options), 200);
      });
    final sut = PasskeyApiRepository(PasskeysApi(apiClient), ConfigPublicApi(apiClient));

    expect(await sut.startRegistration(), options);
    expect(sent.headers['Origin'], 'https://demo.immich.app');
  });

  test('finishRegistration sends the server origin', () async {
    late http.Request sent;
    final apiClient = ApiClient(basePath: 'https://demo.immich.app/api')
      ..client = MockClient((request) async {
        sent = request;
        return http.Response('', 201);
      });
    final sut = PasskeyApiRepository(PasskeysApi(apiClient), ConfigPublicApi(apiClient));

    await sut.finishRegistration({'id': 'credential'});

    expect(sent.headers['Origin'], 'https://demo.immich.app');
  });

  test('startAuthentication sends the code challenge and the server origin, and decodes the options', () async {
    const options = {
      'challenge': 'challenge',
      'rpId': 'demo.immich.app',
      'timeout': 60000,
      'userVerification': 'required',
    };
    late http.Request sent;
    final apiClient = ApiClient(basePath: 'https://demo.immich.app/api')
      ..client = MockClient((request) async {
        sent = request;
        return http.Response(jsonEncode(options), 200);
      });
    final sut = PasskeyApiRepository(PasskeysApi(apiClient), ConfigPublicApi(apiClient));

    expect(await sut.startAuthentication('code-challenge'), options);
    expect(sent.url.queryParameters, {'codeChallenge': 'code-challenge'});
    expect(sent.headers['Origin'], 'https://demo.immich.app');
  });

  test('finishAuthentication sends the whole credential to the server', () async {
    const credential = {
      'id': 'credential',
      'rawId': 'credential',
      'type': 'public-key',
      'response': {'clientDataJSON': 'data', 'authenticatorData': 'authenticator', 'signature': 'signature'},
      'clientExtensionResults': <String, dynamic>{},
    };
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
    final sut = PasskeyApiRepository(PasskeysApi(apiClient), ConfigPublicApi(apiClient));

    expect((await sut.finishAuthentication(credential, 'verifier')).accessToken, 'token');
    expect(jsonDecode(sent.body), {'response': credential, 'codeVerifier': 'verifier'});
    expect(sent.headers['Origin'], 'https://demo.immich.app');
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
    final sut = PasskeyApiRepository(PasskeysApi(apiClient), ConfigPublicApi(apiClient));

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
    final sut = PasskeyApiRepository(PasskeysApi(apiClient), ConfigPublicApi(apiClient));

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
    final sut = PasskeyApiRepository(PasskeysApi(apiClient), ConfigPublicApi(apiClient));

    await sut.delete('passkey-id');

    expect((sent.method, sent.url.path), ('DELETE', '/api/passkeys/passkey-id'));
  });
}
