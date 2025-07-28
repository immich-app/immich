import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/extensions/collection_extensions.dart';
import 'package:immich_mobile/extensions/string_extensions.dart';

void main() {
  group('Test toDuration', () {
    test('ok', () {
      expect("1:02:33".toDuration(), const Duration(hours: 1, minutes: 2, seconds: 33));
    });
    test('malformed', () {
      expect("".toDuration(), isNull);
      expect("1:2".toDuration(), isNull);
      expect("a:b:c".toDuration(), isNull);
    });
  });
  group('Test uniqueConsecutive', () {
    test('empty', () {
      final a = [];
      expect(a.uniqueConsecutive(), []);
    });

    test('singleElement', () {
      final a = [5];
      expect(a.uniqueConsecutive(), [5]);
    });

    test('noDuplicates', () {
      final a = [1, 2, 3];
      expect(a.uniqueConsecutive(), orderedEquals([1, 2, 3]));
    });

    test('unsortedDuplicates', () {
      final a = [1, 2, 1, 3];
      expect(a.uniqueConsecutive(), orderedEquals([1, 2, 1, 3]));
    });

    test('sortedDuplicates', () {
      final a = [6, 6, 2, 3, 3, 3, 4, 5, 1, 1];
      expect(a.uniqueConsecutive(), orderedEquals([6, 2, 3, 4, 5, 1]));
    });

    test('withKey', () {
      final a = ["a", "bb", "cc", "ddd"];
      expect(
        a.uniqueConsecutive(compare: (s1, s2) => s1.length.compareTo(s2.length)),
        orderedEquals(["a", "bb", "ddd"]),
      );
    });
  });
}
