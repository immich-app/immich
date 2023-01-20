import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_test/flutter_test.dart';

import '../test_utils/general_helper.dart';
import '../test_utils/login_helper.dart';

void main() {
  ImmichTestHelper.initialize();

  group("Login input validation test", () {
    testWidgets("Test http warning message", (tester) async {
      await ImmichTestHelper.loadApp(tester);

      await ImmichTestLoginHelper.waitForLoginScreen(tester);
      await ImmichTestLoginHelper.acknowledgeNewServerVersion(tester);

      // Test https URL
      await ImmichTestLoginHelper.enterLoginCredentials(
        tester,
        server: "https://demo.immich.app/api",
      );

      expect(find.text("login_form_err_http_insecure".tr()), findsNothing);

      // Test http URL
      await ImmichTestLoginHelper.enterLoginCredentials(
        tester,
        server: "http://demo.immich.app/api",
      );

      expect(find.text("login_form_err_http_insecure".tr()), findsOneWidget);
    });
  });
}
