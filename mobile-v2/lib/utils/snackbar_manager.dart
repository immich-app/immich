import 'package:flutter/material.dart';
import 'package:immich_mobile/utils/constants/globals.dart';

class SnackbarManager {
  const SnackbarManager();

  static ScaffoldMessengerState? get _s => kScafMessengerKey.currentState;

  static void showError(String errorMsg) {
    _s?.clearSnackBars();
    _s?.showSnackBar(SnackBar(content: Text(errorMsg)));
  }
}
