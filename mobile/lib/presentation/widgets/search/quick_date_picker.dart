import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/models/search/date_filter.model.dart';

enum _QuickPickerType { last1Month, last3Months, last9Months, year, custom }

class QuickDatePicker extends HookWidget {
  QuickDatePicker({super.key, required this.currentInput, required this.onSelect, required this.onRequestPicker})
    : _selection = _selectionFromModel(currentInput),
      _initialYear = _initialYearFromModel(currentInput);

  final Function() onRequestPicker;
  final Function(DateFilterInputModel range) onSelect;

  final DateFilterInputModel? currentInput;
  final _QuickPickerType? _selection;
  final int _initialYear;

  // Generate a list of recent years from 2000 to the current year (including the current one)
  final List<int> _recentYears = List.generate(1 + DateTime.now().year - 2000, (index) {
    return index + 2000;
  });

  static int _initialYearFromModel(DateFilterInputModel? model) {
    return model?.asDateTimeRange()?.start.year ?? DateTime.now().year;
  }

  static _QuickPickerType? _selectionFromModel(DateFilterInputModel? model) {
    if (model is RecentMonthRangeFilter) {
      return switch (model.monthDelta) {
        1 => _QuickPickerType.last1Month,
        3 => _QuickPickerType.last3Months,
        9 => _QuickPickerType.last9Months,
        _ => _QuickPickerType.custom,
      };
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
  Widget _exactPicker(BuildContext context) {
    final hasPreviousInput = currentInput is CustomDateFilter;

    return InkWell(
      onTap: onRequestPicker,
      child: IgnorePointer(
        ignoring: true,
        child: RadioListTile(
          title: const Text('pick_custom_range').tr(),
          subtitle: hasPreviousInput ? Text(currentInput!.asHumanReadable(context)) : null,
          secondary: hasPreviousInput ? const Icon(Icons.edit) : null,
          value: _QuickPickerType.custom,
          toggleable: true,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Scrollbar(
        // Depending on the screen size the last option might get cut off
        // Add a clear visual cue that there are more options when scrolling
        // When the screen size is large enough the scrollbar is hidden automatically
        trackVisibility: true,
        thumbVisibility: true,
        child: SingleChildScrollView(
          child: RadioGroup(
            onChanged: (value) {
              if (value == null) return;
              final _ = switch (value) {
                _QuickPickerType.custom => onRequestPicker(),
                _QuickPickerType.last1Month => onSelect(const RecentMonthRangeFilter(1)),
                _QuickPickerType.last3Months => onSelect(const RecentMonthRangeFilter(3)),
                _QuickPickerType.last9Months => onSelect(const RecentMonthRangeFilter(9)),
                // When a year is selected the combobox triggers onSelect() on its own.
                // Here we handle the radio button being selected which can only ever be the initial year
                _QuickPickerType.year => onSelect(YearFilter(_initialYear)),
              };
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
      ),
    );
  }
}
