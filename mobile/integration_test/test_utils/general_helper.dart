import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:integration_test/integration_test.dart';
import 'package:isar/isar.dart';
// ignore: depend_on_referenced_packages
import 'package:meta/meta.dart';
import 'package:immich_mobile/main.dart' as app;

import 'login_helper.dart';

class ImmichTestHelper {
  final WidgetTester tester;

  ImmichTestHelper(this.tester);

  ImmichTestLoginHelper? _loginHelper;

  ImmichTestLoginHelper get loginHelper {
    _loginHelper ??= ImmichTestLoginHelper(tester);
    return _loginHelper!;
  }

  static Future<IntegrationTestWidgetsFlutterBinding> initialize() async {
    final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
    binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;

    // Load hive, localization...
    await app.initApp();

    return binding;
  }

  static Future<void> loadApp(WidgetTester tester) async {
    await EasyLocalization.ensureInitialized();
    // Clear all data from Isar (reuse existing instance if available)
    final db = Isar.getInstance() ?? await app.loadDb();
    await Store.clear();
    await db.writeTxn(() => db.clear());
    // Load main Widget
    await tester.pumpWidget(
      ProviderScope(
        overrides: [dbProvider.overrideWithValue(db)],
        child: const app.MainWidget(),
      ),
    );
    // Post run tasks
    await EasyLocalization.ensureInitialized();
  }
}

@isTest
void immichWidgetTest(
  String description,
  Future<void> Function(WidgetTester, ImmichTestHelper) test,
) {
  testWidgets(
    description,
    (widgetTester) async {
      await ImmichTestHelper.loadApp(widgetTester);
      await test(widgetTester, ImmichTestHelper(widgetTester));
    },
    semanticsEnabled: false,
  );
}

Future<void> pumpUntilFound(
  WidgetTester tester,
  Finder finder, {
  Duration timeout = const Duration(seconds: 120),
}) async {
  bool found = false;
  final timer =
      Timer(timeout, () => throw TimeoutException("Pump until has timed out"));
  while (found != true) {
    await tester.pump();
    found = tester.any(finder);
  }
  timer.cancel();
}
