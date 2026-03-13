import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

/// Page object for album-related screens.
class AlbumPage {
  final PatrolIntegrationTester $;

  const AlbumPage(this.$);

  /// Create a new album from the albums tab.
  /// Taps the add button, enters the name, and taps Create.
  /// After creation, the app navigates to the album detail page.
  Future<void> createAlbum(String name) async {
    await $(Icons.add_rounded).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(Icons.add_rounded).tap();
    await $.pump(const Duration(seconds: 2));

    // Enter album name using ensureVisible + tester methods
    final titleField = find.byType(TextField).first;
    await $.tester.ensureVisible(titleField);
    await $.pump();
    await $.tester.enterText(titleField, name);
    await $.pump(const Duration(milliseconds: 500));

    // Tap Create button in the AppBar
    await $.tester.ensureVisible(find.text('Create'));
    await $.pump();
    await $.tester.tap(find.text('Create'));
    await $.pump(const Duration(seconds: 3));
  }

  /// Open an album by name from the albums list.
  Future<void> openAlbum(String name) async {
    await $(name).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(name).tap();
    await $.pump(const Duration(seconds: 2));
  }

  /// Delete the currently open album via the kebab menu.
  Future<void> deleteCurrentAlbum() async {
    await $(Icons.more_vert_rounded).waitUntilVisible(
      timeout: const Duration(seconds: 10),
    );
    await $(Icons.more_vert_rounded).tap();
    await $.pump(const Duration(seconds: 1));

    // Tap "Delete album" in the menu
    await $('Delete album').waitUntilVisible(
      timeout: const Duration(seconds: 5),
    );
    await $('Delete album').first.tap();
    await $.pump(const Duration(seconds: 1));

    // Confirm deletion — dialog has "Delete album" as both title and button.
    // The last instance is the confirm button.
    await $('Delete album').last.tap();
    await $.pump(const Duration(seconds: 2));
  }
}
