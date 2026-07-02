import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/presentation/widgets/people/person_edit_birthday_modal.widget.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:intl/intl.dart';
import 'package:scroll_date_picker/scroll_date_picker.dart';

void main() {
  group('datePickerColumnOrder', () {
    test('month first (en_US)', () {
      expect(
        datePickerColumnOrder('M/d/y'),
        orderedEquals([DatePickerViewType.month, DatePickerViewType.day, DatePickerViewType.year]),
      );
    });

    test('day first (pl)', () {
      expect(
        datePickerColumnOrder('dd.MM.y'),
        orderedEquals([DatePickerViewType.day, DatePickerViewType.month, DatePickerViewType.year]),
      );
    });

    test('year first (ko)', () {
      expect(
        datePickerColumnOrder('y. M. d.'),
        orderedEquals([DatePickerViewType.year, DatePickerViewType.month, DatePickerViewType.day]),
      );
    });

    test('null pattern falls back to package default', () {
      expect(datePickerColumnOrder(null), isNull);
    });

    test('missing field falls back to package default', () {
      expect(datePickerColumnOrder('M/y'), isNull);
    });
  });

  group('datePickerColumnOrder with real locale patterns', () {
    setUpAll(() async {
      await initializeDateFormatting();
    });

    test('en uses month/day/year', () {
      expect(
        datePickerColumnOrder(DateFormat.yMd('en').pattern),
        orderedEquals([DatePickerViewType.month, DatePickerViewType.day, DatePickerViewType.year]),
      );
    });

    test('pl uses day/month/year', () {
      expect(
        datePickerColumnOrder(DateFormat.yMd('pl').pattern),
        orderedEquals([DatePickerViewType.day, DatePickerViewType.month, DatePickerViewType.year]),
      );
    });

    test('ko uses year/month/day', () {
      expect(
        datePickerColumnOrder(DateFormat.yMd('ko').pattern),
        orderedEquals([DatePickerViewType.year, DatePickerViewType.month, DatePickerViewType.day]),
      );
    });
  });
}
