import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:fluttertoast/fluttertoast.dart';
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

    immichWidgetTest("Change row size to 2", (tester, helper) async {
      await helper.loginHelper.loginTo(LoginCredentials.testInstance);
      await helper.navigationHelper.openSideDrawer();
      await helper.navigationHelper.openSettings();
      await helper.navigationHelper.openPhotoGridSettings();

      final slider = find.byType(Slider);
      await tester.drag(slider, const Offset(-200, 0));
      await tester.pumpAndSettle();

      await helper.navigationHelper.closeSettings();
      await helper.navigationHelper.closeSideDrawer();

      await tester.pump(const Duration(seconds: 2));

      await helper.loginHelper.waitForTimeline();

      expect(
        helper.assetGridHelper.findThumbnailImagesInRow(0),
        findsNWidgets(2),
      );
    });

    immichWidgetTest("Selection test", (tester, helper) async {
      await helper.loginHelper.loginTo(LoginCredentials.testInstance);

      // Select 1...8 images
      for (int row = 0; row < 2; row++) {
        for (int image = 0; image < 4; image++) {
          await tester.longPress(
            helper.assetGridHelper.findThumbnailImagesInRow(row).at(image),
          );
          await tester.pump();

          // Assert text of selection indicator
          expect(find.text("${(row * 4) + (image + 1)}"), findsOneWidget);

          // Expect delete button
          expect(
            find.text("control_bottom_app_bar_delete".tr()),
            findsOneWidget,
          );
        }
      }

      // Tap on selection indicator
      await tester.tap(find.text("8"));
      await tester.pump();

      // Selection indicator and delete button should be gone
      expect(find.text("8"), findsNothing);
      expect(
        find.text("control_bottom_app_bar_delete".tr()),
        findsNothing,
      );
    });

    immichWidgetTest("Test add to album from selection",
        (tester, helper) async {
      final albumName = helper.createRandomAlbumName();

      await helper.loginHelper.loginTo(LoginCredentials.testInstance);
      await helper.navigationHelper.navigateToLibrary();
      await helper.albumHelper.createAlbum(albumName);
      await helper.navigationHelper.closeAlbum();
      await helper.navigationHelper.navigateToPhotos();

      // Select second image
      await tester.longPress(
        helper.assetGridHelper.findThumbnailImagesInRow(0).at(1),
      );

      await tester.pump(const Duration(seconds: 1));
      await tester.tap(find.text(albumName).first);
      await tester.pump(const Duration(seconds: 2));

      // Wait for toast message
      for (var i = 0; i < 60; i++) {
        if (tester.any(find.byType(FToast))) {
          final result = find.text(
            "home_page_add_to_album_success".tr(
              namedArgs: {
                "added": "1",
                "album": albumName,
              },
            ),
          );
          expect(result, findsOneWidget);
        }
        await tester.pump(const Duration(milliseconds: 300));
      }
    });

  });
}
