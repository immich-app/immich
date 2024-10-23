import 'package:flutter/material.dart';
import 'package:immich_mobile/utils/constants/globals.dart';

abstract final class SnackbarManager {
  const SnackbarManager();

  static ScaffoldMessengerState? get _s => kScafMessengerKey.currentState;

  static void showError(String errorMsg) {
    _s?.clearSnackBars();
    _s?.showSnackBar(SnackBar(content: Text(errorMsg)));
  }

  static void showText({required String content, TextStyle? style}) {
    _s?.clearSnackBars();
    _s?.showSnackBar(SnackBar(content: Text(content, style: style)));
  }
}
