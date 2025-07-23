import 'package:flutter_test/flutter_test.dart';
import 'package:timezone/data/latest.dart';
import 'package:immich_mobile/services/action.service.dart';

void main() {
  setUpAll(() {
    initializeTimeZones();
  });

  group("Returns timezone offset", () {
    final dateTime = DateTime.parse("2025-01-01T00:00:00+0800");

    test('Returns null with invalid timezone', () {
      const timeZone = "#_#";
      final timeZoneOffset = ActionService.getTimeZoneOffset(dateTime, timeZone);

      expect(timeZoneOffset, null);
    });

    test('With timezone as location', () {
      const timeZone = "Asia/Hong_Kong";
      final timeZoneOffset = ActionService.getTimeZoneOffset(dateTime, timeZone);

      expect(timeZoneOffset, const Duration(hours: 8));
    });

    test('With timezone as offset', () {
      const timeZone = "utc+08:00";
      final timeZoneOffset = ActionService.getTimeZoneOffset(dateTime, timeZone);

      expect(timeZoneOffset, const Duration(hours: 8));
    });
  });
}
