import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import '../common/patrol_config.dart';
import '../common/test_app.dart';
import '../common/wait_helpers.dart';
import '../fixtures/seed_data.dart';
import '../pages/login_page.dart';
import '../pages/timeline_page.dart';

void main() {
  final seeder = TestDataSeeder();

  patrolSetUp(() async {
    await seeder.seed();
  });

  patrolTest(
    'Login with valid credentials loads the timeline',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);

      await loginPage.loginWithTestCredentials();

      // After login, the app may request gallery permissions (native dialog).
      // Grant it so the timeline can load.
      await grantPermissionIfRequested($);

      await timelinePage.waitForLoaded();
      expect(timelinePage.isVisible, isTrue);
    },
  );

  patrolTest(
    'Login with wrong password shows error',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);

      await loginPage.enterServerUrl(testServerUrl);
      await loginPage.waitForCredentialsScreen();
      await loginPage.acknowledgeNewServerVersionIfPresent();
      await loginPage.enterCredentials(
        email: testEmail,
        password: 'wrong-password',
      );
      await loginPage.tapLogin();
      // Should still be on the credentials screen (login failed)
      await loginPage.waitForCredentialsScreen();
    },
  );
}
