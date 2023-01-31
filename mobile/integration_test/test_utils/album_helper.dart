import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/modules/album/ui/selection_thumbnail_image.dart';

class ImmichTestAlbumHelper {
  final WidgetTester tester;

  ImmichTestAlbumHelper(this.tester);

  Future<void> createAlbum(String name, {int timeoutSeconds = 20, addNthAsset = 0 }) async {
    await tester.tap(find.text("library_page_new_album".tr()));
    await tester.pumpAndSettle(const Duration(seconds: 1));
    // Enter name
    await tester.enterText(find.byType(TextField), name);
    // Select photos
    await tester.tap(find.text("create_shared_album_page_share_select_photos".tr()));
    await tester.pumpAndSettle();
    // Select nth asset
    await tester.tap(find.byType(SelectionThumbnailImage).at(addNthAsset));
    await tester.pumpAndSettle();
    // Close selection page
    await tester.tap(find.text("share_add".tr()).first);
    await tester.pumpAndSettle(const Duration(seconds: 1));
    // Create
    await tester.tap(find.text("create_shared_album_page_create".tr()));
    await tester.pump(const Duration(seconds: 3));
    // Wait until found album in library page
    for (var i = 0; i < timeoutSeconds; i++) {
      // Search for "IMMICH" test in the app bar
      final result = find.text(name);
      if (tester.any(result)) {
        return;
      }

      await tester.pump(const Duration(seconds: 1));
    }
    fail("Timeout during album creation.");
  }

}