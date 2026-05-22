import 'package:flutter/material.dart';

final scrollToDateNotifierProvider = ScrollToDateNotifier(null);

class ScrollToDateNotifier extends ValueNotifier<DateTime?> {
  ScrollToDateNotifier(super.value);

  void scrollToDate(DateTime date) {
    value = date;

    // Manually notify listeners to trigger the scroll, even if the value hasn't changed
    notifyListeners();
  }
}
