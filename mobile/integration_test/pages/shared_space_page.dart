import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

/// Page object for shared spaces screens.
class SharedSpacePage {
  final PatrolIntegrationTester $;

  const SharedSpacePage(this.$);

  /// Navigate to shared spaces from the library tab.
  Future<void> openFromLibrary() async {
    final spacesText = find.text('Spaces');
    for (var i = 0; i < 10; i++) {
      await $.pump(const Duration(milliseconds: 500));
      if ($.tester.any(spacesText)) break;
    }
    await $.tester.ensureVisible(spacesText);
    await $.pump();
    await $.tester.tap(spacesText);
    await $.pump(const Duration(seconds: 2));
  }

  /// Create a new shared space via the FAB and dialog.
  Future<void> createSpace(String name) async {
    await $(FloatingActionButton).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(FloatingActionButton).tap();
    await $.pump(const Duration(seconds: 1));

    final textField = find.byType(TextField).first;
    await $.tester.ensureVisible(textField);
    await $.pump();
    await $.tester.enterText(textField, name);
    await $.pump(const Duration(milliseconds: 500));

    await $.tester.ensureVisible(find.text('Create'));
    await $.pump();
    await $.tester.tap(find.text('Create'));
    await $.pump(const Duration(seconds: 2));
  }

  /// Open a shared space by name.
  Future<void> openSpace(String name) async {
    await $(name).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(name).tap();
    await $.pump(const Duration(seconds: 2));
  }

  /// Toggle "show in timeline" for the current space.
  Future<void> toggleShowInTimeline() async {
    await $(Icons.visibility).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(Icons.visibility).tap();
    await $.pump(const Duration(seconds: 1));
  }

  /// Delete the current space via the popup menu.
  Future<void> deleteCurrentSpace() async {
    await $(Icons.more_vert).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(Icons.more_vert).tap();
    await $.pump(const Duration(seconds: 1));

    await $('Delete Space').waitUntilVisible(
      timeout: const Duration(seconds: 5),
    );
    await $('Delete Space').tap();
    await $.pump(const Duration(seconds: 1));

    // Confirm deletion in the alert dialog
    final deleteButton = find.widgetWithText(TextButton, 'Delete');
    await $.tester.ensureVisible(deleteButton);
    await $.pump();
    await $.tester.tap(deleteButton);
    await $.pump(const Duration(seconds: 2));
  }

  /// Navigate to the members page from the space detail.
  Future<void> openMembers() async {
    await $(Icons.people_outline).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(Icons.people_outline).tap();
    await $.pump(const Duration(seconds: 2));
  }

  /// Tap the add member button on the members page.
  Future<void> tapAddMember() async {
    await $(Icons.person_add_outlined).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(Icons.person_add_outlined).tap();
    await $.pump(const Duration(seconds: 2));
  }

  /// Select a user by name in the member selection page, then confirm.
  Future<void> selectAndAddMember(String userName) async {
    await $(userName).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(userName).tap();
    await $.pump(const Duration(milliseconds: 500));

    final addButton = find.text('Add');
    if ($.tester.any(addButton)) {
      await $.tester.tap(addButton);
    } else {
      await $.tester.tap(find.text('add'));
    }
    await $.pump(const Duration(seconds: 2));
  }

  /// Tap on a member by name to open their action sheet.
  Future<void> tapMember(String memberName) async {
    await $(memberName).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(memberName).tap();
    await $.pump(const Duration(seconds: 1));
  }

  /// Change a member's role via the bottom sheet.
  /// Call [tapMember] first to open the sheet.
  Future<void> setMemberRole(String role) async {
    final roleText = 'Set as $role';
    await $(roleText).waitUntilVisible(
      timeout: const Duration(seconds: 5),
    );
    await $(roleText).tap();
    await $.pump(const Duration(seconds: 1));
  }

  /// Remove a member via the bottom sheet.
  /// Call [tapMember] first to open the sheet.
  Future<void> removeMember() async {
    await $('Remove from Space').waitUntilVisible(
      timeout: const Duration(seconds: 5),
    );
    await $('Remove from Space').tap();
    await $.pump(const Duration(seconds: 1));

    final removeButton = find.widgetWithText(TextButton, 'Remove');
    await $.tester.ensureVisible(removeButton);
    await $.pump();
    await $.tester.tap(removeButton);
    await $.pump(const Duration(seconds: 2));
  }

  /// Leave the space via the bottom sheet (non-owner).
  /// Call [tapMember] with own name first to open the sheet.
  Future<void> leaveSpace() async {
    await $('Leave Space').waitUntilVisible(
      timeout: const Duration(seconds: 5),
    );
    await $('Leave Space').tap();
    await $.pump(const Duration(seconds: 1));

    final leaveButton = find.widgetWithText(TextButton, 'Leave');
    await $.tester.ensureVisible(leaveButton);
    await $.pump();
    await $.tester.tap(leaveButton);
    await $.pump(const Duration(seconds: 2));
  }

  /// Verify a space appears in the spaces list.
  Future<bool> isSpaceVisible(String name) async {
    await $.pump(const Duration(seconds: 1));
    return $.tester.any(find.text(name));
  }

  /// Verify a member appears in the members list.
  Future<bool> isMemberVisible(String memberName) async {
    await $.pump(const Duration(seconds: 1));
    return $.tester.any(find.text(memberName));
  }

  /// Navigate back (pops current route).
  Future<void> goBack() async {
    await $.tester.tap(find.byType(BackButton));
    await $.pump(const Duration(seconds: 1));
  }
}
