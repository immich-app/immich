import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/memory.model.dart';

void main() {
  group('MemoryData', () {
    test('parses generic rule payloads without requiring a year', () {
      final data = MemoryData.fromMap({
        'ruleId': 'birthday',
        'title': 'Happy birthday, Alice',
        'subtitle': 'Photos from different years',
      });

      expect(data.year, isNull);
      expect(data.ruleId, 'birthday');
      expect(data.title, 'Happy birthday, Alice');
      expect(data.subtitle, 'Photos from different years');
      expect(data.toMap(), containsPair('ruleId', 'birthday'));
    });

    test('keeps on-this-day year access for legacy memories', () {
      final data = MemoryData.fromMap({'year': 2024});

      expect(data.year, 2024);
      expect(data.title, isNull);
    });
  });
}
