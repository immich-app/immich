import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/theme/color_scheme.dart';
import 'package:immich_mobile/theme/immich_ui_scope.dart';
import 'package:immich_mobile/theme/theme_data.dart';
import 'package:snapshot_test/snapshot_test.dart';

import '../widget_tester_extensions.dart';

/// Declares one component snapshot test per brightness (theme) for [subject], rendering [build] wrapped under the app providers
///
/// Creates `images/<subject>.<theme>.png`
void componentSnapshotTest(
  String subject,
  Widget Function() build, {
  List<Override> Function()? overrides,
  Future<void> Function(WidgetTester tester)? beforeCapture,
}) => snapshotTest(
  subject,
  build: build,
  theme: (context, brightness, subject) {
    final immichTheme = ImmichColorPreset.indigo.themeOfPreset;
    final theme = getThemeData(
      colorScheme: brightness == Brightness.dark ? immichTheme.dark : immichTheme.light,
      locale: locales.values.first,
    );

    return Theme(
      data: theme,
      child: ImmichUiScope(
        child: Material(color: theme.colorScheme.surface, child: subject),
      ),
    );
  },
  mount: (tester, root) => tester.pumpConsumerWidget(root, overrides: overrides?.call() ?? const []),
  beforeCapture: beforeCapture,
);

/// Declares one page snapshot test per brightness (theme)
///
/// To be used with widget trees that require a router
///
/// Creates `images/<subject>.<theme>.png`
void pageSnapshotTest(
  String subject,
  Widget Function() build, {
  List<Override> Function()? overrides,
  Future<void> Function(WidgetTester tester)? beforeCapture,
}) => snapshotTest(
  subject,
  build: build,
  theme: _appTheme,
  mount: (tester, root) => tester.pumpConsumerRouterWidget(root, overrides: overrides?.call() ?? const []),
  beforeCapture: beforeCapture,
);

/// Mirrors the theme `main.dart` puts above every screen, with the preset pinned
Widget _appTheme(BuildContext context, Brightness brightness, Widget subject) {
  final immichTheme = ImmichColorPreset.indigo.themeOfPreset;
  final theme = getThemeData(
    colorScheme: brightness == Brightness.dark ? immichTheme.dark : immichTheme.light,
    locale: locales.values.first,
  );

  return Theme(
    data: theme,
    child: ImmichUiScope(
      child: Material(color: theme.colorScheme.surface, child: subject),
    ),
  );
}
