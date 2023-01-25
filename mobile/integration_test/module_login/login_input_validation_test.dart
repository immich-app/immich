import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_test/flutter_test.dart';

import '../test_utils/general_helper.dart';
import '../test_utils/login_helper.dart';

void main() async {
  await ImmichTestHelper.initialize();

  group("Login input validation test", () {
    immichWidgetTest("Test leading/trailing whitespace", (tester, helper) async {
      await helper.loginHelper.waitForLoginScreen();
      await helper.loginHelper.acknowledgeNewServerVersion();

      await helper.loginHelper.enterCredentials(
        email: " demo@immich.app"
      );

      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text("login_form_err_leading_whitespace".tr()), findsOneWidget);

      await helper.loginHelper.enterCredentials(
          email: "demo@immich.app "
      );

      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text("login_form_err_trailing_whitespace".tr()), findsOneWidget);
    });

    immichWidgetTest("Test invalid email", (tester, helper) async {
      await helper.loginHelper.waitForLoginScreen();
      await helper.loginHelper.acknowledgeNewServerVersion();

      await helper.loginHelper.enterCredentials(
          email: "demo.immich.app"
      );

      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text("login_form_err_invalid_email".tr()), findsOneWidget);
    });

  });
}
