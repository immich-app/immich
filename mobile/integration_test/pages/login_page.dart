import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import '../common/test_app.dart';

/// Page object for the Immich login screen.
///
/// The login flow has two phases:
///   Phase 1: Server URL entry → tap "Next"
///   Phase 2: Email/password entry → tap "Login"
class LoginPage {
  final PatrolIntegrationTester $;

  const LoginPage(this.$);

  // --- Phase 1: Server URL ---

  /// Wait for the server URL screen (phase 1) to be visible.
  Future<void> waitForServerUrlScreen() async {
    await $('Next').waitUntilVisible();
  }

  /// Enter the server URL and proceed to the credentials screen.
  Future<void> enterServerUrl(String url) async {
    await waitForServerUrlScreen();
    // Scroll the form into view — the login form is in a SingleChildScrollView
    // and the TextFormField may be below the fold (logo + spacer push it down).
    await $.tester.ensureVisible(find.byType(TextFormField).first);
    await $.pump();
    // Use tester.enterText directly to bypass patrol's hit-test
    // (the field may overlap with the rotating logo's bounding box)
    await $.tester.enterText(find.byType(TextFormField).first, url);
    await $.pump();
    // Tap the "Next" button
    await $.tester.ensureVisible(find.text('Next'));
    await $.pump();
    await $.tester.tap(find.text('Next'));
    await $.pump();
  }

  // --- Phase 2: Credentials ---

  /// Wait for the credentials screen (phase 2) to be visible.
  /// This is the screen with "Login" button after server URL is validated.
  Future<void> waitForCredentialsScreen() async {
    await $('Login').waitUntilVisible();
  }

  /// Acknowledge the new server version dialog if it appears.
  Future<void> acknowledgeNewServerVersionIfPresent() async {
    try {
      final ack = $('Acknowledge');
      if (ack.exists) {
        await ack.tap();
      }
    } on Exception {
      // Dialog not present, continue
    }
  }

  /// Enter email and password on the credentials screen (phase 2).
  Future<void> enterCredentials({
    required String email,
    required String password,
  }) async {
    final emailField = find.byType(TextFormField).at(0);
    final passwordField = find.byType(TextFormField).at(1);

    await $.tester.ensureVisible(emailField);
    await $.pump();
    await $.tester.enterText(emailField, email);
    await $.pump();

    await $.tester.ensureVisible(passwordField);
    await $.pump();
    await $.tester.enterText(passwordField, password);
    await $.pump();
  }

  /// Tap the login button on the credentials screen.
  Future<void> tapLogin() async {
    await $.tester.ensureVisible(find.text('Login'));
    await $.pump();
    await $.tester.tap(find.text('Login'));
    await $.pump();
  }

  /// Full login flow with default test credentials.
  Future<void> loginWithTestCredentials() async {
    await enterServerUrl(testServerUrl);
    await waitForCredentialsScreen();
    await acknowledgeNewServerVersionIfPresent();
    await enterCredentials(email: testEmail, password: testPassword);
    await tapLogin();
  }
}
