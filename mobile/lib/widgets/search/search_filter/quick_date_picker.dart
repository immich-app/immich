import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

class QuickDatePicker extends HookWidget {
  const QuickDatePicker({super.key, required this.onSelect, required this.onRequestPicker});

  final Function() onRequestPicker;
  final Function(DateTimeRange<DateTime> range) onSelect;

  void _selectRange(DateTimeRange range) {
    // Ensure we don't go beyond today, eg when picking "in $current_year"
    final now = DateTime.now();
    if (range.end.isAfter(now)) {
      range = DateTimeRange(start: range.start, end: now);
    }

    onSelect(range);
  }

  ListTile _monthListTile(int monthsFromNow) {
    String label = monthsFromNow == 1
        ? 'last_month'.tr()
        : 'last_nth_month'.tr(namedArgs: {"months": monthsFromNow.toString()});
    return ListTile(
      title: Text(label),
      onTap: () {
        final now = DateTime.now();
        // We use the first of the target month here to avoid issues with different month lengths
        // the negative overflow of months is handled by DateTime correctly
        final from = DateTime(now.year, now.month - monthsFromNow, 1);
        _selectRange(DateTimeRange(start: from, end: now));
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemBuilder: (context, index) {
        if (index == 0) {
          return ListTile(
            title: Text('pick_exact_date'.tr()),
            onTap: () {
              onRequestPicker();
            },
          );
        } else if (index == 1) {
          return _monthListTile(1);
        } else if (index == 2) {
          return _monthListTile(3);
        } else if (index == 3) {
          return _monthListTile(9);
        } else {
          final now = DateTime.now();
          final years = index - 4;
          final year = now.year - years;
          return ListTile(
            title: Text("in_year".tr(namedArgs: {"year": year.toString()})),
            onTap: () {
              final from = DateTime(year, 1, 1);
              final to = DateTime(year, 12, 31, 23, 59, 59);
              _selectRange(DateTimeRange(start: from, end: to));
            },
          );
        }
      },
      itemCount: 50,
    );
  }
}
