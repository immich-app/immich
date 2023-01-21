import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_test/flutter_test.dart';

import '../test_utils/general_helper.dart';
import '../test_utils/login_helper.dart';

void main() async {
  await ImmichTestHelper.initialize();

  group("Login input validation test", () {
    immichWidgetTest("Test http warning message", (tester) async {
      await ImmichTestLoginHelper.waitForLoginScreen(tester);
      await ImmichTestLoginHelper.acknowledgeNewServerVersion(tester);

      // Test https URL
      await ImmichTestLoginHelper.enterLoginCredentials(
        tester,
        server: "https://demo.immich.app/api",
      );

      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text("login_form_err_http_insecure".tr()), findsNothing);

      // Test http URL
      await ImmichTestLoginHelper.enterLoginCredentials(
        tester,
        server: "http://demo.immich.app/api",
      );

      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text("login_form_err_http_insecure".tr()), findsOneWidget);
    });
  });
}
