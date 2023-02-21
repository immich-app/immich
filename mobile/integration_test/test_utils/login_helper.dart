import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';

import 'general_helper.dart';

class ImmichTestLoginHelper {
  final WidgetTester tester;

  ImmichTestLoginHelper(this.tester);

  Future<void> waitForLoginScreen() async {
    await pumpUntilFound(tester, find.text("Login"));
  }

  Future<bool> acknowledgeNewServerVersion() async {
    await pumpUntilFound(tester, find.text("Acknowledge"));
    final result = find.text("Acknowledge");

    await tester.tap(result);
    await tester.pump();

    return true;
  }

  Future<void> enterCredentials({
    String server = "",
    String email = "",
    String password = "",
  }) async {
    final loginForms = find.byType(TextFormField);

    await tester.enterText(loginForms.at(0), email);
    await tester.pump();

    await tester.enterText(loginForms.at(1), password);
    await tester.pump();

    await tester.enterText(loginForms.at(2), server);
    await tester.pump();

    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();
  }

  Future<void> enterCredentialsOf(LoginCredentials credentials) async {
    await enterCredentials(
      server: credentials.server,
      email: credentials.email,
      password: credentials.password,
    );
  }

  Future<void> pressLoginButton() async {
    await pumpUntilFound(tester, find.textContaining("login_form_button_text".tr()));
    final button = find.textContaining("login_form_button_text".tr());
    await tester.tap(button);
  }

  Future<void> assertLoginSuccess({int timeoutSeconds = 15}) async {
    await pumpUntilFound(tester, find.text("home_page_building_timeline".tr()));
  }

  Future<void> assertLoginFailed({int timeoutSeconds = 15}) async {
      await pumpUntilFound(tester, find.text("login_form_failed_login".tr()));
  }

  Future<void> waitForTimeline({int timeoutSeconds = 120}) async {
    for (var i = 0; i < timeoutSeconds * 2; i++) {
      if (tester.any(find.byType(ImmichAssetGrid))) {
        return;
      }
      await tester.pump(const Duration(milliseconds: 500));
    }

    fail("Wait for timeline timed out.");
  }

  Future<void> loginTo(
    LoginCredentials credentials, {
    int timelineTimeoutSeconds = 360,
  }) async {
    // All required steps for the login process
    await waitForLoginScreen();
    await acknowledgeNewServerVersion();
    await enterCredentialsOf(credentials);
    await pressLoginButton();
    await assertLoginSuccess();
    // Wait for timeline
    await waitForTimeline(timeoutSeconds: timelineTimeoutSeconds);
    // Wait some more time
    await tester.pumpAndSettle(const Duration(seconds: 1));
  }
}

enum LoginCredentials {
  testInstance(
    "https://flutter-int-test.preview.immich.app",
    "demo@immich.app",
    "demo",
  ),

  testInstanceButWithWrongPassword(
    "https://flutter-int-test.preview.immich.app",
    "demo@immich.app",
    "wrong",
  ),

  wrongInstanceUrl(
    "https://does-not-exist.preview.immich.app",
    "demo@immich.app",
    "demo",
  );

  const LoginCredentials(this.server, this.email, this.password);

  final String server;
  final String email;
  final String password;
}
