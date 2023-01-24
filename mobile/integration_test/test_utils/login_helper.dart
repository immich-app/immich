import 'dart:async';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/immich_asset_grid.dart';

class ImmichTestLoginHelper {
  final WidgetTester tester;

  ImmichTestLoginHelper(this.tester);

  Future<void> waitForLoginScreen({int timeoutSeconds = 20}) async {
    for (var i = 0; i < timeoutSeconds; i++) {
      // Search for "IMMICH" test in the app bar
      final result = find.text("IMMICH");
      if (tester.any(result)) {
        // Wait 5s until everything settled
        await tester.pump(const Duration(seconds: 5));
        return;
      }

      // Wait 1s before trying again
      await Future.delayed(const Duration(seconds: 1));
    }

    fail("Timeout while waiting for login screen");
  }

  Future<bool> acknowledgeNewServerVersion() async {
    final result = find.text("Acknowledge");
    if (!tester.any(result)) {
      return false;
    }

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

    await tester.pump(const Duration(milliseconds: 500));
    await tester.enterText(loginForms.at(0), email);

    await tester.pump(const Duration(milliseconds: 500));
    await tester.enterText(loginForms.at(1), password);

    await tester.pump(const Duration(milliseconds: 500));
    await tester.enterText(loginForms.at(2), server);

    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pumpAndSettle();
  }

  Future<void> enterCredentialsOf(LoginCredentials credentials) async {
    await enterCredentials(
      server: credentials.server,
      email: credentials.email,
      password: credentials.password,
    );
  }

  Future<void> pressLoginButton() async {
    final button = find.textContaining("login_form_button_text".tr());
    await tester.tap(button);
  }

  Future<void> assertLoginSuccess({int timeoutSeconds = 15}) async {
    for (var i = 0; i < timeoutSeconds * 2; i++) {
      if (tester.any(find.text("home_page_building_timeline".tr()))) {
        return;
      }

      await tester.pump(const Duration(milliseconds: 500));
    }

    fail("Login failed.");
  }

  Future<void> assertLoginFailed({int timeoutSeconds = 15}) async {
    for (var i = 0; i < timeoutSeconds * 2; i++) {
      if (tester.any(find.text("login_form_failed_login".tr()))) {
        return;
      }

      await tester.pump(const Duration(milliseconds: 500));
    }

    fail("Timeout.");
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
