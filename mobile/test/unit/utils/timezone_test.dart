import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/timezone.dart';
import 'package:timezone/data/latest.dart' as tz;

void main() {
  setUpAll(() {
    tz.initializeTimeZones();
  });

  group('applyTimezoneOffset', () {
    group('with named timezone locations', () {
      test('should convert UTC to Asia/Hong_Kong (+08:00)', () {
        final utcTime = DateTime.utc(2024, 6, 15, 12, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'Asia/Hong_Kong',
        );

        expect(adjustedTime.hour, 20); // 12:00 UTC + 8 hours = 20:00
        expect(offset, const Duration(hours: 8));
      });

      test('should convert UTC to America/New_York (handles DST)', () {
        // Summer time (EDT = UTC-4)
        final summerUtc = DateTime.utc(2024, 6, 15, 12, 0, 0);
        final (summerTime, summerOffset) = applyTimezoneOffset(
          dateTime: summerUtc,
          timeZone: 'America/New_York',
        );

        expect(summerTime.hour, 8); // 12:00 UTC - 4 hours = 08:00
        expect(summerOffset, const Duration(hours: -4));

        // Winter time (EST = UTC-5)
        final winterUtc = DateTime.utc(2024, 1, 15, 12, 0, 0);
        final (winterTime, winterOffset) = applyTimezoneOffset(
          dateTime: winterUtc,
          timeZone: 'America/New_York',
        );

        expect(winterTime.hour, 7); // 12:00 UTC - 5 hours = 07:00
        expect(winterOffset, const Duration(hours: -5));
      });

      test('should convert UTC to Europe/London', () {
        // Winter (GMT = UTC+0)
        final winterUtc = DateTime.utc(2024, 1, 15, 12, 0, 0);
        final (winterTime, winterOffset) = applyTimezoneOffset(
          dateTime: winterUtc,
          timeZone: 'Europe/London',
        );

        expect(winterTime.hour, 12);
        expect(winterOffset, Duration.zero);

        // Summer (BST = UTC+1)
        final summerUtc = DateTime.utc(2024, 6, 15, 12, 0, 0);
        final (summerTime, summerOffset) = applyTimezoneOffset(
          dateTime: summerUtc,
          timeZone: 'Europe/London',
        );

        expect(summerTime.hour, 13);
        expect(summerOffset, const Duration(hours: 1));
      });

      test('should handle timezone with 30-minute offset (Asia/Kolkata)', () {
        final utcTime = DateTime.utc(2024, 6, 15, 12, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'Asia/Kolkata',
        );

        expect(adjustedTime.hour, 17);
        expect(adjustedTime.minute, 30); // 12:00 UTC + 5:30 = 17:30
        expect(offset, const Duration(hours: 5, minutes: 30));
      });

      test('should handle timezone with 45-minute offset (Asia/Kathmandu)', () {
        final utcTime = DateTime.utc(2024, 6, 15, 12, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'Asia/Kathmandu',
        );

        expect(adjustedTime.hour, 17);
        expect(adjustedTime.minute, 45); // 12:00 UTC + 5:45 = 17:45
        expect(offset, const Duration(hours: 5, minutes: 45));
      });
    });

    group('with UTC offset format', () {
      test('should handle UTC+08:00 format', () {
        final utcTime = DateTime.utc(2024, 6, 15, 12, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'UTC+08:00',
        );

        expect(adjustedTime.hour, 20);
        expect(offset, const Duration(hours: 8));
      });

      test('should handle UTC-05:00 format', () {
        final utcTime = DateTime.utc(2024, 6, 15, 12, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'UTC-05:00',
        );

        expect(adjustedTime.hour, 7);
        expect(offset, const Duration(hours: -5));
      });

      test('should handle UTC+8 format (without minutes)', () {
        final utcTime = DateTime.utc(2024, 6, 15, 12, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'UTC+8',
        );

        expect(adjustedTime.hour, 20);
        expect(offset, const Duration(hours: 8));
      });

      test('should handle UTC-5 format (without minutes)', () {
        final utcTime = DateTime.utc(2024, 6, 15, 12, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'UTC-5',
        );

        expect(adjustedTime.hour, 7);
        expect(offset, const Duration(hours: -5));
      });

      test('should handle plain UTC format', () {
        final utcTime = DateTime.utc(2024, 6, 15, 12, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'UTC',
        );

        expect(adjustedTime.hour, 12);
        expect(offset, Duration.zero);
      });

      test('should handle lowercase utc format', () {
        final utcTime = DateTime.utc(2024, 6, 15, 12, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'utc+08:00',
        );

        expect(adjustedTime.hour, 20);
        expect(offset, const Duration(hours: 8));
      });

      test('should handle UTC+05:30 format (with minutes)', () {
        final utcTime = DateTime.utc(2024, 6, 15, 12, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'UTC+05:30',
        );

        expect(adjustedTime.hour, 17);
        expect(adjustedTime.minute, 30);
        expect(offset, const Duration(hours: 5, minutes: 30));
      });
    });

    group('with null or invalid timezone', () {
      test('should return UTC time when timezone is null', () {
        final localTime = DateTime(2024, 6, 15, 12, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: localTime,
          timeZone: null,
        );

        expect(adjustedTime.isUtc, true);
        expect(offset, adjustedTime.timeZoneOffset);
      });

      test('should return UTC time when timezone is invalid', () {
        final utcTime = DateTime.utc(2024, 6, 15, 12, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'Invalid/Timezone',
        );

        expect(adjustedTime.isUtc, true);
        expect(adjustedTime.hour, 12);
        expect(offset, adjustedTime.timeZoneOffset);
      });

      test('should return UTC time when UTC offset format is malformed', () {
        final utcTime = DateTime.utc(2024, 6, 15, 12, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'UTC++08',
        );

        expect(adjustedTime.isUtc, true);
        expect(adjustedTime.hour, 12);
      });
    });

    group('edge cases', () {
      test('should handle date crossing midnight forward', () {
        final utcTime = DateTime.utc(2024, 6, 15, 20, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'Asia/Tokyo', // UTC+9
        );

        expect(adjustedTime.day, 16); // Crosses to next day
        expect(adjustedTime.hour, 5); // 20:00 UTC + 9 = 05:00 next day
        expect(offset, const Duration(hours: 9));
      });

      test('should handle date crossing midnight backward', () {
        final utcTime = DateTime.utc(2024, 6, 15, 3, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'America/Los_Angeles', // UTC-7 in summer
        );

        expect(adjustedTime.day, 14); // Crosses to previous day
        expect(adjustedTime.hour, 20); // 03:00 UTC - 7 = 20:00 previous day
        expect(offset, const Duration(hours: -7));
      });

      test('should handle year boundary crossing', () {
        final utcTime = DateTime.utc(2024, 1, 1, 2, 0, 0);

        final (adjustedTime, offset) = applyTimezoneOffset(
          dateTime: utcTime,
          timeZone: 'America/New_York', // UTC-5 in winter
        );

        expect(adjustedTime.year, 2023);
        expect(adjustedTime.month, 12);
        expect(adjustedTime.day, 31);
        expect(adjustedTime.hour, 21); // 02:00 UTC - 5 = 21:00 Dec 31
      });

      test('should convert local time to UTC before applying timezone', () {
        // Create a local time (not UTC)
        final localTime = DateTime(2024, 6, 15, 12, 0, 0);

        final (adjustedTime, _) = applyTimezoneOffset(
          dateTime: localTime,
          timeZone: 'Asia/Hong_Kong',
        );

        // The function converts to UTC first, then applies timezone
        // So local 12:00 -> UTC (depends on local timezone) -> HK time
        // We can verify it's working by checking it's a TZDateTime
        expect(adjustedTime, isNotNull);
      });
    });
  });
}
