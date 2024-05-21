import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

extension PumpConsumerWidget on WidgetTester {
  /// Wraps the provided [widget] with Material app such that it becomes:
  ///
  /// ProviderScope
  ///   |-MaterialApp
  ///     |-Material
  ///       |-[widget]
  Future<void> pumpConsumerWidget(
    Widget widget, {
    Duration? duration,
    EnginePhase phase = EnginePhase.sendSemanticsUpdate,
    List<Override> overrides = const [],
  }) async {
    return pumpWidget(
      ProviderScope(
        overrides: overrides,
        child: MaterialApp(
          debugShowCheckedModeBanner: false,
          home: Material(child: widget),
        ),
      ),
      duration: duration,
      phase: phase,
    );
  }
}
