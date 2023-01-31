import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class ImmichTestNavigationHelper {
  final WidgetTester tester;

  ImmichTestNavigationHelper(this.tester);

  Future<void> openSideDrawer() async {
    await _tapFirstOf(IconButton);
  }

  Future<void> closeSideDrawer() async {
    // Not nice but the only thing that worked....
    await tester.tap(find.byType(IconButton).at(1));
  }

  Future<void> openSettings() async {
    await _clickOnByI18nText("profile_drawer_settings");
  }

  Future<void> closeSettings() async {
    await _tapFirstOf(IconButton);
  }

  Future<void> openPhotoGridSettings() async {
    await _clickOnByI18nText("asset_list_settings_title");
  }

  Future<void> clickSignOutButton() async {
    await _clickOnByI18nText("profile_drawer_sign_out");
  }

  Future<void> navigateToLibrary() async {
    await _clickOnByI18nText("tab_controller_nav_library");
  }

  Future<void> navigateToPhotos() async {
    await _clickOnByI18nText("tab_controller_nav_photos");
  }

  Future<void> closeAlbum() async {
    await _tapFirstOf(IconButton);
    await tester.pump();
  }

  Future<void> _clickOnByI18nText(String text) async {
    final btn = find.textContaining(text.tr());
    expect(btn, findsOneWidget);

    await tester.tap(btn);
    await tester.pumpAndSettle();
  }

  Future<void> _tapFirstOf(Type type) async {
    final widget = find.byType(IconButton);
    expect(widget, findsWidgets);

    await tester.tap(widget.first);
    await tester.pumpAndSettle();
  }
}
