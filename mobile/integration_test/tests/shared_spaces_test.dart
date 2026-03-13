import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

import '../common/patrol_config.dart';
import '../common/test_app.dart';
import '../common/wait_helpers.dart';
import '../fixtures/seed_data.dart';
import '../pages/login_page.dart';
import '../pages/shared_space_page.dart';
import '../pages/timeline_page.dart';

void main() {
  final seeder = TestDataSeeder();

  patrolSetUp(() async {
    await seeder.seed();
  });

  patrolTest(
    'Create shared space and toggle timeline visibility',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);
      final spacePage = SharedSpacePage($);

      await loginPage.loginWithTestCredentials();
      await grantPermissionIfRequested($);
      await timelinePage.waitForLoaded();
      await timelinePage.goToLibrary();
      await spacePage.openFromLibrary();
      await spacePage.createSpace('Test Space');
      await spacePage.openSpace('Test Space');
      await spacePage.toggleShowInTimeline();
    },
  );

  patrolTest(
    'Create and delete a shared space',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);
      final spacePage = SharedSpacePage($);

      await loginPage.loginWithTestCredentials();
      await grantPermissionIfRequested($);
      await timelinePage.waitForLoaded();
      await timelinePage.goToLibrary();
      await spacePage.openFromLibrary();

      // Create and verify space exists
      await spacePage.createSpace('Delete Me Space');
      expect(await spacePage.isSpaceVisible('Delete Me Space'), isTrue);

      // Open space and delete it
      await spacePage.openSpace('Delete Me Space');
      await spacePage.deleteCurrentSpace();

      // Should be back on the spaces list; space should be gone
      await $.pump(const Duration(seconds: 2));
      expect(await spacePage.isSpaceVisible('Delete Me Space'), isFalse);
    },
  );

  patrolTest(
    'Add member to space and change their role',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);
      final spacePage = SharedSpacePage($);

      await loginPage.loginWithTestCredentials();
      await grantPermissionIfRequested($);
      await timelinePage.waitForLoaded();
      await timelinePage.goToLibrary();
      await spacePage.openFromLibrary();

      // Create a space
      await spacePage.createSpace('Members Test Space');
      await spacePage.openSpace('Members Test Space');

      // Navigate to members
      await spacePage.openMembers();

      // Add the second user
      await spacePage.tapAddMember();
      await spacePage.selectAndAddMember(TestDataSeeder.secondUserName);

      // Verify member appears
      expect(
        await spacePage.isMemberVisible(TestDataSeeder.secondUserName),
        isTrue,
      );

      // Change role to Editor
      await spacePage.tapMember(TestDataSeeder.secondUserName);
      await spacePage.setMemberRole('Editor');

      // Verify role was updated
      await $.pump(const Duration(seconds: 1));
    },
  );

  patrolTest(
    'Remove member from space',
    config: patrolConfig,
    ($) async {
      await pumpImmichApp($);

      final loginPage = LoginPage($);
      final timelinePage = TimelinePage($);
      final spacePage = SharedSpacePage($);

      // Seed a space with the second user as a member via API
      final spaceId = await seeder.createSpace('Remove Test Space');
      final secondUserId = await seeder.getSecondUserId();
      await seeder.addSpaceMember(spaceId, secondUserId);

      await loginPage.loginWithTestCredentials();
      await grantPermissionIfRequested($);
      await timelinePage.waitForLoaded();
      await timelinePage.goToLibrary();
      await spacePage.openFromLibrary();

      // Open the pre-seeded space
      await spacePage.openSpace('Remove Test Space');
      await spacePage.openMembers();

      // Verify member is there
      expect(
        await spacePage.isMemberVisible(TestDataSeeder.secondUserName),
        isTrue,
      );

      // Remove the member
      await spacePage.tapMember(TestDataSeeder.secondUserName);
      await spacePage.removeMember();

      // Verify member is gone
      await $.pump(const Duration(seconds: 1));
      expect(
        await spacePage.isMemberVisible(TestDataSeeder.secondUserName),
        isFalse,
      );
    },
  );
}
