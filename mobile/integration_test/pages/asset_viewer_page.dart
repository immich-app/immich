import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:patrol/patrol.dart';

/// Page object for the asset detail/viewer screen.
class AssetViewerPage {
  final PatrolIntegrationTester $;

  const AssetViewerPage(this.$);

  /// Wait for the viewer to be visible (PageView indicates the viewer is open).
  Future<void> waitForVisible() async {
    await $(PageView).waitUntilVisible(
      timeout: const Duration(seconds: 30),
    );
  }

  /// Swipe left to next asset.
  Future<void> swipeToNext() async {
    await $.tester.drag(
      find.byType(PageView).first,
      const Offset(-300, 0),
    );
    await $.pump(const Duration(milliseconds: 500));
  }

  /// Swipe right to previous asset.
  Future<void> swipeToPrevious() async {
    await $.tester.drag(
      find.byType(PageView).first,
      const Offset(300, 0),
    );
    await $.pump(const Duration(milliseconds: 500));
  }

  /// Go back to timeline.
  Future<void> goBack() async {
    await $.platformAutomator.android.pressBack();
    await $.pump(const Duration(milliseconds: 500));
  }
}
