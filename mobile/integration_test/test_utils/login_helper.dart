import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class ImmichTestLoginHelper {
  static Future<void> waitForLoginScreen(WidgetTester tester,
      {int timeoutSeconds = 20}) async {
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

  static Future<bool> acknowledgeNewServerVersion(WidgetTester tester) async {
    final result = find.text("Acknowledge");
    if (!tester.any(result)) {
      return false;
    }

    await tester.tap(result);
    await tester.pump();

    return true;
  }

  static Future<void> enterLoginCredentials(
    WidgetTester tester, {
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

    await tester.pump(const Duration(milliseconds: 500));
  }
}
