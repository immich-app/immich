import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/generated/translations.g.dart';

import 'general_helper.dart';

class ImmichTestLoginHelper {
  final WidgetTester tester;

  const ImmichTestLoginHelper(this.tester);

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

  Future<void> enterCredentials({String server = "", String email = "", String password = ""}) async {
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
    await enterCredentials(server: credentials.server, email: credentials.email, password: credentials.password);
  }

  Future<void> pressLoginButton() async {
    await pumpUntilFound(tester, find.textContaining(StaticTranslations.instance.login));
    final button = find.textContaining(StaticTranslations.instance.login);
    await tester.tap(button);
  }

  Future<void> assertLoginSuccess() async {
    await pumpUntilFound(tester, find.text(StaticTranslations.instance.home_page_building_timeline));
  }

  Future<void> assertLoginFailed() async {
    await pumpUntilFound(tester, find.text(StaticTranslations.instance.login_form_failed_login));
  }
}

enum LoginCredentials {
  testInstance("https://flutter-int-test.preview.immich.app", "demo@immich.app", "demo"),

  testInstanceButWithWrongPassword("https://flutter-int-test.preview.immich.app", "demo@immich.app", "wrong"),

  wrongInstanceUrl("https://does-not-exist.preview.immich.app", "demo@immich.app", "demo");

  const LoginCredentials(this.server, this.email, this.password);

  final String server;
  final String email;
  final String password;
}
