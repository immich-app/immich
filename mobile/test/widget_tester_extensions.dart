import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

extension PumpConsumerWidget on WidgetTester {
  /// Wraps the provided [widget] with Material app such that it becomes:
  ///
  /// ProviderScope
  ///   |-EasyLocalization
  ///     |-MaterialApp
  ///       |-Material
  ///         |-[widget]
  Future<void> pumpConsumerWidget(
    Widget widget, {
    Duration? duration,
    EnginePhase phase = EnginePhase.sendSemanticsUpdate,
    List<Override> overrides = const [],
  }) async {
    return pumpWidget(
      ProviderScope(
        overrides: overrides,
        child: EasyLocalization(
          supportedLocales: const [Locale('en', 'US')],
          startLocale: const Locale('en', 'US'),
          fallbackLocale: const Locale('en', 'US'),
          assetLoader: const RootBundleAssetLoader(),
          path: 'assets/i18n',
          useOnlyLangCode: true,
          child: MaterialApp(
            debugShowCheckedModeBanner: false,
            home: Material(child: widget),
          ),
        ),
      ),
      duration: duration,
      phase: phase,
    );
  }
}
