import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

class ImmichTestNavigationHelper {
  final WidgetTester tester;

  ImmichTestNavigationHelper(this.tester);

  Future<void> openSideDrawer() async {
    final drawerButton = find.byType(IconButton);
    expect(drawerButton, findsWidgets);

    await tester.tap(drawerButton.first);
    await tester.pumpAndSettle();
  }

  Future<void> clickSignOutButton() async {
    final drawerButton = find.textContaining("profile_drawer_sign_out".tr());
    expect(drawerButton, findsOneWidget);

    await tester.tap(drawerButton.first);
    await tester.pumpAndSettle();
  }
}
