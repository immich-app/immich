import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/builtin_extensions.dart';

void main() {
  group('Test toDuration', () {
    test('ok', () {
      expect(
        "1:02:33".toDuration(),
        const Duration(hours: 1, minutes: 2, seconds: 33),
      );
    });
    test('malformed', () {
      expect("".toDuration(), null);
      expect("1:2".toDuration(), null);
      expect("a:b:c".toDuration(), null);
    });
  });
}
