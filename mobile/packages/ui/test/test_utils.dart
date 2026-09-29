import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_ui/src/snackbar.dart';

extension WidgetTesterExtension on WidgetTester {
  Future<void> pumpTestWidget(Widget widget) {
    return pumpWidget(
      MaterialApp(
        scaffoldMessengerKey: scaffoldMessengerKey,
        home: Scaffold(body: widget),
      ),
    );
  }
}
