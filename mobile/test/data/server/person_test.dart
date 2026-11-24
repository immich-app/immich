import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:immich_mobile/data/server/person.dart';
import 'package:openapi/api.dart';

void main() {
  test('update stores a null name as an empty string', () async {
    const person = {
      'id': 'person1',
      'name': null,
      'birthDate': null,
      'thumbnailPath': null,
      'isHidden': false,
      'otherPeople': <Object>[],
      'sharedBy': <Object>[],
      'sharedWith': <Object>[],
    };
    final apiClient = ApiClient(basePath: 'https://demo.immich.app/api')
      ..client = MockClient((_) async => http.Response(jsonEncode(person), 200));
    final sut = PersonApiRepository(PeopleApi(apiClient));

    final result = await sut.update('person1', name: '');

    expect(result.name, '');
  });
}
