import 'package:flutter_test/flutter_test.dart';
import 'package:openapi/api.dart';

void main() {
  test('serializes person birthDate as the selected civil date', () {
    final dto = PersonUpdateDto(birthDate: DateTime(1975, 3, 8));

    expect(dto.toJson()['birthDate'], '1975-03-08');
  });
}
