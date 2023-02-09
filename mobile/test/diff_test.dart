import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/diff.dart';

void main() {
  final List<int> listA = [1, 2, 3, 4, 6];
  final List<int> listB = [1, 3, 5, 7];

  group('Test grouped', () {
    test('test partial overlap', () async {
      final List<int> onlyInA = [];
      final List<int> onlyInB = [];
      final List<int> inBoth = [];
      final changes = await diffSortedLists(
        listA,
        listB,
        compare: (a, b) => a.compareTo(b),
        both: (a, b) {
          inBoth.add(b);
          return false;
        },
        onlyFirst: (a) => onlyInA.add(a),
        onlySecond: (b) => onlyInB.add(b),
      );
      expect(changes, true);
      expect(onlyInA, [2, 4, 6]);
      expect(onlyInB, [5, 7]);
      expect(inBoth, [1, 3]);
    });
  });
}
