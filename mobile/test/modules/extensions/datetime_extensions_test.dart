import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/extensions/datetime_extensions.dart';
import 'package:intl/date_symbol_data_local.dart';

void main() {
  setUpAll(() async {
    await initializeDateFormatting();
  });

  group('DateRangeFormatting.formatDateRange', () {
    final currentYear = DateTime.now().year;

    test('returns single date format for this year', () {
      final date = DateTime(currentYear, 8, 28); // Aug 28 this year
      final result = DateRangeFormatting.formatDateRange(date, date, null);
      expect(result, 'Aug 28');
    });

    test('returns single date format for other year', () {
      final date = DateTime(2023, 8, 28); // Aug 28, 2023
      final result = DateRangeFormatting.formatDateRange(date, date, null);
      expect(result, 'Aug 28, 2023');
    });

    test('returns date range format for this year', () {
      final startDate = DateTime(currentYear, 3, 23); // Mar 23
      final endDate = DateTime(currentYear, 5, 31); // May 31
      final result =
          DateRangeFormatting.formatDateRange(startDate, endDate, null);
      expect(result, 'Mar 23 - May 31');
    });

    test('returns date range format for other year (same year)', () {
      final startDate = DateTime(2023, 8, 28); // Aug 28
      final endDate = DateTime(2023, 9, 30); // Sep 30
      final result =
          DateRangeFormatting.formatDateRange(startDate, endDate, null);
      expect(result, 'Aug 28 - Sep 30, 2023');
    });

    test('returns date range format over multiple years', () {
      final startDate = DateTime(2021, 4, 17); // Apr 17, 2021
      final endDate = DateTime(2022, 4, 9); // Apr 9, 2022
      final result =
          DateRangeFormatting.formatDateRange(startDate, endDate, null);
      expect(result, 'Apr 17, 2021 - Apr 9, 2022');
    });
  });
}
