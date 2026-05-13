import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

extension WidgetTesterExtension on WidgetTester {
  /// Pumps a widget wrapped in MaterialApp and Scaffold for testing.
  Future<void> pumpTestWidget(Widget widget) {
    return pumpWidget(MaterialApp(home: Scaffold(body: widget)));
  }
}
