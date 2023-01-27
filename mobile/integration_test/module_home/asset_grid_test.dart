import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import '../test_utils/general_helper.dart';
import '../test_utils/login_helper.dart';

void main() async {
  await ImmichTestHelper.initialize();

  group("Asset grid tests", () {
    immichWidgetTest("Test initial 4 images per row", (tester, helper) async {
      await helper.loginHelper.loginTo(LoginCredentials.testInstance);

      expect(
        helper.assetGridHelper.findThumbnailImagesInRow(0),
        findsNWidgets(4),
      );
    });

    immichWidgetTest("Change row size", (tester, helper) async {
      await helper.loginHelper.loginTo(LoginCredentials.testInstance);
      await helper.navigationHelper.openSideDrawer();
      await helper.navigationHelper.openSettings();
      await helper.navigationHelper.openPhotoGridSettings();

      final slider = find.byType(Slider);
      await tester.drag(slider, const Offset(-200, 0));
      await tester.pumpAndSettle();

      await helper.navigationHelper.closeSettings();
      await helper.navigationHelper.closeSideDrawer();

      await helper.loginHelper.waitForTimeline();

      expect(
        helper.assetGridHelper.findThumbnailImagesInRow(0),
        findsNWidgets(2),
      );
    });
  });
}
