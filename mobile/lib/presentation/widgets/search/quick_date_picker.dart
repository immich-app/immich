import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';

sealed class DateFilterInputModel {
  DateTimeRange<DateTime> asDateTimeRange();

  String asHumanReadable(BuildContext context) {
    // General implementation for arbitrary date and time ranges
    // If date range is less than 24 hours, set the end date to the end of the day
    final date = asDateTimeRange();
    if (date.end.difference(date.start).inHours < 24) {
      return DateFormat.yMMMd().format(date.start.toLocal());
    } else {
      return 'search_filter_date_interval'.t(
        context: context,
        args: {
          "start": DateFormat.yMMMd().format(date.start.toLocal()),
          "end": DateFormat.yMMMd().format(date.end.toLocal()),
        },
      );
    }
  }
}

class RecentMonthRangeFilter extends DateFilterInputModel {
  final int monthDelta;
  RecentMonthRangeFilter(this.monthDelta);

  @override
  DateTimeRange<DateTime> asDateTimeRange() {
    final now = DateTime.now();
    // Note that DateTime's constructor properly handles month overflow.
    final from = DateTime(now.year, now.month - monthDelta, 1);
    return DateTimeRange<DateTime>(start: from, end: now);
  }

  @override
  String asHumanReadable(BuildContext context) {
    return 'last_months'.t(context: context, args: {"count": monthDelta.toString()});
  }
}

class YearFilter extends DateFilterInputModel {
  final int year;
  YearFilter(this.year);

  @override
  DateTimeRange<DateTime> asDateTimeRange() {
    final now = DateTime.now();
    final from = DateTime(year, 1, 1);

    if (now.year == year) {
      // To not go beyond today if the user picks the current year
      return DateTimeRange<DateTime>(start: from, end: now);
    }

    final to = DateTime(year, 12, 31, 23, 59, 59);
    return DateTimeRange<DateTime>(start: from, end: to);
  }

  @override
  String asHumanReadable(BuildContext context) {
    return 'in_year'.tr(namedArgs: {"year": year.toString()});
  }
}

class CustomDateFilter extends DateFilterInputModel {
  final DateTime start;
  final DateTime end;

  CustomDateFilter(this.start, this.end);

  factory CustomDateFilter.fromRange(DateTimeRange<DateTime> range) {
    return CustomDateFilter(range.start, range.end);
  }

  @override
  DateTimeRange<DateTime> asDateTimeRange() {
    return DateTimeRange<DateTime>(start: start, end: end);
  }
}

enum _QuickPickerType { last1Month, last3Months, last9Months, year, custom }

class QuickDatePicker extends HookWidget {
  QuickDatePicker({
    super.key,
    required DateFilterInputModel? currentInput,
    required this.onSelect,
    required this.onRequestPicker,
  }) : _selection = _selectionFromModel(currentInput),
       _initialYear = _initialYearFromModel(currentInput);

  final Function() onRequestPicker;
  final Function(DateFilterInputModel range) onSelect;

  final _QuickPickerType? _selection;
  final int _initialYear;

  // Generate a list of recent years from 2000 to the current year (including the current one)
  final List<int> _recentYears = List.generate(1 + DateTime.now().year - 2000, (index) {
    return index + 2000;
  });

  static int _initialYearFromModel(DateFilterInputModel? model) {
    return model?.asDateTimeRange().start.year ?? DateTime.now().year;
  }

  static _QuickPickerType? _selectionFromModel(DateFilterInputModel? model) {
    if (model is RecentMonthRangeFilter) {
      switch (model.monthDelta) {
        case 1:
          return _QuickPickerType.last1Month;
        case 3:
          return _QuickPickerType.last3Months;
        case 9:
          return _QuickPickerType.last9Months;
        default:
          return _QuickPickerType.custom;
      }
    } else if (model is YearFilter) {
      return _QuickPickerType.year;
    } else if (model is CustomDateFilter) {
      return _QuickPickerType.custom;
    }
    return null;
  }

  Text _monthLabel(BuildContext context, int monthsFromNow) =>
      const Text('last_months').t(context: context, args: {"count": monthsFromNow.toString()});

  Widget _yearPicker(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return Row(
      children: [
        const Text("in_year_selector").tr(),
        const SizedBox(width: 15),
        Expanded(
          child: DropdownMenu(
            initialSelection: _initialYear,
            menuStyle: MenuStyle(maximumSize: WidgetStateProperty.all(Size(size.width, size.height * 0.5))),
            dropdownMenuEntries: _recentYears.map((e) => DropdownMenuEntry(value: e, label: e.toString())).toList(),
            onSelected: (year) {
              if (year == null) return;
              onSelect(YearFilter(year));
            },
          ),
        ),
      ],
    );
  }

  // We want the exact date picker to always be selectable.
  // Even if it's already toggled it should always open the full date picker, RadioListTiles don't do that by default
  // so we wrap it in a InkWell
  Widget _exactPicker(BuildContext context) => InkWell(
    onTap: onRequestPicker,
    child: IgnorePointer(
      ignoring: true,
      child: RadioListTile(title: const Text('pick_exact_date').tr(), value: _QuickPickerType.custom, toggleable: true),
    ),
  );

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        clipBehavior: Clip.none,
        child: RadioGroup(
          onChanged: (value) {
            switch (value) {
              case _QuickPickerType.custom:
                onRequestPicker();
                break;
              case _QuickPickerType.last1Month:
                onSelect(RecentMonthRangeFilter(1));
                break;
              case _QuickPickerType.last3Months:
                onSelect(RecentMonthRangeFilter(3));
                break;
              case _QuickPickerType.last9Months:
                onSelect(RecentMonthRangeFilter(9));
                break;
              case _QuickPickerType.year:
                // The combobox triggers the onSelect event on its own so if this is ever selected it can only be on
                // the default value set by the constructor
                onSelect(YearFilter(_initialYear));
                break;
              default:
                break;
            }
          },
          groupValue: _selection,
          child: Column(
            children: [
              RadioListTile(title: _monthLabel(context, 1), value: _QuickPickerType.last1Month, toggleable: true),
              RadioListTile(title: _monthLabel(context, 3), value: _QuickPickerType.last3Months, toggleable: true),
              RadioListTile(title: _monthLabel(context, 9), value: _QuickPickerType.last9Months, toggleable: true),
              RadioListTile(title: _yearPicker(context), value: _QuickPickerType.year, toggleable: true),
              _exactPicker(context),
            ],
          ),
        ),
      ),
    );
  }
}
