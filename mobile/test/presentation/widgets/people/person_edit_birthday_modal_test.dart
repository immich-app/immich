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

    for (final (locales, order, name) in const [
      (
        ['en', 'en-US', 'en-PH'],
        [DatePickerViewType.month, DatePickerViewType.day, DatePickerViewType.year],
        'month/day/year',
      ),
      (
        ['en-GB', 'fr', 'fr-FR', 'de', 'de-DE', 'pl'],
        [DatePickerViewType.day, DatePickerViewType.month, DatePickerViewType.year],
        'day/month/year',
      ),
      (
        ['ja', 'ja-JP', 'zh', 'zh-CN', 'ko', 'ko-KR'],
        [DatePickerViewType.year, DatePickerViewType.month, DatePickerViewType.day],
        'year/month/day',
      ),
      (['ky'], [DatePickerViewType.year, DatePickerViewType.day, DatePickerViewType.month], 'year/day/month'),
    ]) {
      for (final locale in locales) {
        test('$locale uses $name', () {
          expect(datePickerColumnOrder(DateFormat.yMd(locale).pattern), orderedEquals(order));
        });
      }
    }
  });
}
