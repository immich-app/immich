import 'package:easy_localization/easy_localization.dart';
import 'package:flutter_test/flutter_test.dart';

import '../test_utils/general_helper.dart';
import '../test_utils/login_helper.dart';

void main() async {
  await ImmichTestHelper.initialize();

  group("Login input validation test", () {
    immichWidgetTest("Test leading/trailing whitespace", (tester) async {
      await ImmichTestLoginHelper.waitForLoginScreen(tester);
      await ImmichTestLoginHelper.acknowledgeNewServerVersion(tester);

      await ImmichTestLoginHelper.enterLoginCredentials(
        tester,
        email: " demo@immich.app"
      );

      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text("login_form_err_leading_whitespace".tr()), findsOneWidget);

      await ImmichTestLoginHelper.enterLoginCredentials(
          tester,
          email: "demo@immich.app "
      );

      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text("login_form_err_trailing_whitespace".tr()), findsOneWidget);
    });

    immichWidgetTest("Test invalid email", (tester) async {
      await ImmichTestLoginHelper.waitForLoginScreen(tester);
      await ImmichTestLoginHelper.acknowledgeNewServerVersion(tester);

      await ImmichTestLoginHelper.enterLoginCredentials(
          tester,
          email: "demo.immich.app"
      );

      await tester.pump(const Duration(milliseconds: 300));

      expect(find.text("login_form_err_invalid_email".tr()), findsOneWidget);
    });

  });
}
