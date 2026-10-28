import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:immich_mobile/data/server/passkey.dart';
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
}
