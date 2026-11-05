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

    expect(await sut.startRegistration(), options);
  });
}
