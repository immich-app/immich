
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:immich_mobile/main.dart' as app;

class ImmichTestHelper {

  static IntegrationTestWidgetsFlutterBinding initialize() {
    final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
    binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;

    return binding;
  }

  static Future<void> loadApp(WidgetTester tester) async {
    app.main();
    await tester.pumpAndSettle();
    await EasyLocalization.ensureInitialized();
  }

}