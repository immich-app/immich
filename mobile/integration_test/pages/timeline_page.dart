import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

/// Page object for the Immich main timeline screen.
class TimelinePage {
  final PatrolIntegrationTester $;

  const TimelinePage(this.$);

  /// Wait for the timeline to finish loading (NavigationBar visible).
  Future<void> waitForLoaded() async {
    await $(NavigationBar).waitUntilVisible(
      timeout: const Duration(seconds: 30),
    );
  }

  /// Verify we are on the timeline screen.
  bool get isVisible => $(NavigationBar).exists;

  /// Tap on the first visible asset thumbnail.
  Future<void> tapFirstAsset() async {
    final assets = $(Image);
    await assets.first.tap();
  }

  /// Scroll down on the timeline.
  Future<void> scrollDown() async {
    await $.tester.drag(
      find.byType(Scrollable).first,
      const Offset(0, -300),
    );
    await $.pump(const Duration(milliseconds: 500));
  }

  /// Navigate to the search tab.
  Future<void> goToSearch() async {
    await $(Icons.search_rounded).tap();
    await $.pump(const Duration(seconds: 1));
  }

  /// Navigate to the albums tab.
  Future<void> goToAlbums() async {
    await $(Icons.photo_album_outlined).tap();
    await $.pump(const Duration(seconds: 1));
  }

  /// Navigate to the library tab.
  Future<void> goToLibrary() async {
    await $(Icons.space_dashboard_outlined).tap();
    await $.pump(const Duration(seconds: 1));
  }
}
