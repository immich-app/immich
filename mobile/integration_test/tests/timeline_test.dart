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
    'Login and verify timeline loads',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);

      await loginPage.loginWithTestCredentials();
      await grantPermissionIfRequested($);
      await timelinePage.waitForLoaded();
      expect(timelinePage.isVisible, isTrue);

      // Verify we can scroll the timeline (even if empty)
      await timelinePage.scrollDown();
    },
  );
}
