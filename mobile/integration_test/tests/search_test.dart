import 'package:patrol/patrol.dart';

import '../common/patrol_config.dart';
import '../common/test_app.dart';
import '../common/wait_helpers.dart';
import '../fixtures/seed_data.dart';
import '../pages/login_page.dart';
import '../pages/search_page.dart';
import '../pages/timeline_page.dart';

void main() {
  final seeder = TestDataSeeder();

  patrolSetUp(() async {
    await seeder.seed();
  });

  patrolTest(
    'Search for assets by text',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);
      final searchPage = SearchPage($);

      await loginPage.loginWithTestCredentials();
      await grantPermissionIfRequested($);
      await timelinePage.waitForLoaded();
      await timelinePage.goToSearch();
      await searchPage.search('photo');
    },
  );
}
