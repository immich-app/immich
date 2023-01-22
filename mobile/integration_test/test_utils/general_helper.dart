
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:immich_mobile/main.dart';
import 'package:integration_test/integration_test.dart';

import 'package:immich_mobile/main.dart' as app;

class ImmichTestHelper {

  static Future<IntegrationTestWidgetsFlutterBinding> initialize() async {
    final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
    binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;

    // Load hive, localization...
    await app.initApp();

    return binding;
  }

  static Future<void> loadApp(WidgetTester tester) async {
    // Clear all data from Hive
    await Hive.deleteFromDisk();
    await app.openBoxes();
    // Load main Widget
    await tester.pumpWidget(app.getMainWidget());
    // Post run tasks
    await tester.pumpAndSettle();
    await EasyLocalization.ensureInitialized();
  }

}

void immichWidgetTest(String description, Future<void> Function(WidgetTester) test) {
  testWidgets(description, (widgetTester) async {
    await ImmichTestHelper.loadApp(widgetTester);
    await test(widgetTester);
  });
}