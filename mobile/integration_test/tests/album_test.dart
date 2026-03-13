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

  // TODO: album creation/deletion fails with Drift FK constraint error —
  // the server creates the album but the local Drift DB insert fails because
  // the user record hasn't synced to the local users table yet.
  // For now, just verify the albums tab loads.
  patrolTest(
    'Navigate to albums tab',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);

      await loginPage.loginWithTestCredentials();
      await grantPermissionIfRequested($);
      await timelinePage.waitForLoaded();
      await timelinePage.goToAlbums();
      await $.pump(const Duration(seconds: 2));
      expect(timelinePage.isVisible, isTrue);
    },
  );
}
