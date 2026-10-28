import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:immich_mobile/data/server/passkey.dart';
import 'package:immich_mobile/domain/models/passkey.model.dart';
import 'package:openapi/api.dart';

void main() {
  test('startRegistration decodes the Map<String, Object> answer through the generated client', () async {
    const options = {
      'challenge': 'challenge',
      'rp': {'name': 'Immich', 'id': 'my.immich.app'},
      'timeout': 60000,
    };
    final apiClient = ApiClient(basePath: 'https://demo.immich.app/api')
      ..client = MockClient((_) async => http.Response(jsonEncode(options), 200));
    final sut = PasskeyApiRepository(PasskeysApi(apiClient), ConfigPublicApi(apiClient));

    expect(jsonDecode(await sut.startRegistration()), options);
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
    Object? body;
    final apiClient = ApiClient(basePath: 'https://demo.immich.app/api')
      ..client = MockClient((request) async {
        body = jsonDecode(request.body);
        return http.Response(jsonEncode(login), 201);
      });
    final sut = PasskeyApiRepository(PasskeysApi(apiClient), ConfigPublicApi(apiClient));

    expect((await sut.finishAuthentication(jsonEncode(credential))).accessToken, 'token');
    expect(body, {'response': credential});
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
}
