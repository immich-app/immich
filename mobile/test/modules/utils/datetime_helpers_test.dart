import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/datetime_helpers.dart';

void main() {
  group('tryFromSecondsSinceEpoch', () {
    test('returns null for null input', () {
      final result = tryFromSecondsSinceEpoch(null);
      expect(result, isNull);
    });

    test('returns null for value below minimum allowed range', () {
      // _minMillisecondsSinceEpoch = -62135596800000
      final seconds = -62135596800000 ~/ 1000 - 1; // One second before min allowed
      final result = tryFromSecondsSinceEpoch(seconds);
      expect(result, isNull);
    });

    test('returns null for value above maximum allowed range', () {
      // _maxMillisecondsSinceEpoch = 8640000000000000
      final seconds = 8640000000000000 ~/ 1000 + 1; // One second after max allowed
      final result = tryFromSecondsSinceEpoch(seconds);
      expect(result, isNull);
    });

    test('returns correct DateTime for minimum allowed value', () {
      final seconds = -62135596800000 ~/ 1000; // Minimum allowed timestamp
      final result = tryFromSecondsSinceEpoch(seconds);
      expect(result, DateTime.fromMillisecondsSinceEpoch(-62135596800000));
    });

    test('returns correct DateTime for maximum allowed value', () {
      final seconds = 8640000000000000 ~/ 1000; // Maximum allowed timestamp
      final result = tryFromSecondsSinceEpoch(seconds);
      expect(result, DateTime.fromMillisecondsSinceEpoch(8640000000000000));
    });

    test('returns correct DateTime for negative timestamp', () {
      final seconds = -1577836800; // Dec 31, 1919 (pre-epoch)
      final result = tryFromSecondsSinceEpoch(seconds);
      expect(result, DateTime.fromMillisecondsSinceEpoch(-1577836800 * 1000));
    });

    test('returns correct DateTime for zero timestamp', () {
      final seconds = 0; // Jan 1, 1970 (epoch)
      final result = tryFromSecondsSinceEpoch(seconds);
      expect(result, DateTime.fromMillisecondsSinceEpoch(0));
    });

    test('returns correct DateTime for recent timestamp', () {
      final now = DateTime.now();
      final seconds = now.millisecondsSinceEpoch ~/ 1000;
      final result = tryFromSecondsSinceEpoch(seconds);
      expect(result?.year, now.year);
      expect(result?.month, now.month);
      expect(result?.day, now.day);
    });
  });
}
