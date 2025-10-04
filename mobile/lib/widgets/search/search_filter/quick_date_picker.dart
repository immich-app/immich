import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';

class QuickDatePicker extends HookWidget {
  const QuickDatePicker({super.key, required this.onSelect, required this.onRequestPicker});

  final Function() onRequestPicker;
  final Function(DateTimeRange<DateTime> range) onSelect;

  ListTile _monthListTile(String text, int monthsFromNow) {
    return ListTile(
      title: Text(text),
      onTap: () {
        final now = DateTime.now();
        final from = DateTime(now.year, now.month - monthsFromNow, now.day);
        onSelect(DateTimeRange(start: from, end: now));
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemBuilder: (context, index) {
        if (index == 0) {
          return ListTile(
            title: const Text("Exact date"),
            onTap: () {
              onRequestPicker();
            },
          );
        } else if (index == 1) {
          return _monthListTile("Last month", 1);
        } else if (index == 2) {
          return _monthListTile("Last 3 months", 3);
        } else if (index == 3) {
          return _monthListTile("Last 9 months", 9);
        } else {
          final now = DateTime.now();
          final years = index - 4;
          final year = now.year - years;
          return ListTile(
            title: Text("In $year"),
            onTap: () {
              final from = DateTime(year, 1, 1);
              final to = DateTime(year, 12, 31, 23, 59, 59);
              onSelect(DateTimeRange(start: from, end: to));
            },
          );
        }
      },
      itemCount: 50,
    );
  }
}
