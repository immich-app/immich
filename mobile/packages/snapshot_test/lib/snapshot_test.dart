import 'dart:io';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';

/// The viewport a snapshot is placed within
///
/// Not the most popular Android size, but slightly smaller than most popular Android sizes and smaller than modern iOS devices
const snapshotLayoutSize = Size(375, 812);
const snapshotDevicePixelRatio = 3.0;

const _fadeIn = Duration(milliseconds: 150);
const _frame = Duration(milliseconds: 16);

/// Declares one snapshot test per [Brightness] (theme) for [subject]. Will create `images/<subject>.<light|dark>.png` next to the calling file
void snapshotTest(
  String subject, {
  required Widget Function() build,
  required Widget Function(BuildContext context, Brightness brightness, Widget subject) theme,
  Future<void> Function(WidgetTester tester, Widget root) mount = _mountMaterialApp,
  Future<void> Function(WidgetTester tester)? beforeCapture,
  double? cropPadding,
}) {
  for (final brightness in Brightness.values) {
    testWidgets('$subject (${brightness.name})', (tester) async {
      tester.view
        ..physicalSize = snapshotLayoutSize * snapshotDevicePixelRatio
        ..devicePixelRatio = snapshotDevicePixelRatio;

      addTearDown(tester.view.reset);

      // Image cache persists between tests, so it needs to be cleared
      PaintingBinding.instance.imageCache
        ..clear()
        ..clearLiveImages();

      tester.platformDispatcher.platformBrightnessTestValue = brightness;
      addTearDown(tester.platformDispatcher.clearPlatformBrightnessTestValue);

      await mount(tester, Builder(builder: (context) => theme(context, brightness, _SnapshotSubject(child: build()))));
      await tester.pump(_frame);

      if (cropPadding != null) {
        // We want to capture some area around the nominal size of the widget, so we resize the view relative to its previous size and pump
        final size = tester.getSize(find.byType(_SnapshotSubject));

        tester.view.physicalSize =
            Size(size.width + cropPadding * 2, size.height + cropPadding * 2) * snapshotDevicePixelRatio;

        await tester.pump(_frame);
      }

      await beforeCapture?.call(tester);
      await _awaitPendingImages(tester);
      await tester.pump(_fadeIn);

      final path = 'images/$subject.${brightness.name}.png';

      if (!_pathExists(path)) {
        registerException(
          TestFailure('No snapshot image: $path. Generate it with "mise test:snapshot:update"'),
          StackTrace.empty,
        );

        return;
      }

      await expectLater(_captureSurface(tester), matchesGoldenFile(path));
    });
  }
}

/// Wait for all images to be decoded and available (not marked as pending)
Future<void> _awaitPendingImages(WidgetTester tester, {int maxFrames = 120}) async {
  final cache = PaintingBinding.instance.imageCache;

  for (var frame = 0; frame < maxFrames && cache.pendingImageCount > 0; frame++) {
    await tester.runAsync(() => Future<void>.delayed(const Duration(milliseconds: 4)));

    await tester.pump(_frame);
  }
}

Future<void> _mountMaterialApp(WidgetTester tester, Widget root) =>
    tester.pumpWidget(MaterialApp(debugShowCheckedModeBanner: false, home: root));

Future<ui.Image> _captureSurface(WidgetTester tester) {
  final view = tester.binding.renderViews.single;
  return (view.debugLayer! as OffsetLayer).toImage(view.paintBounds);
}

/// Widget marker for retrieval of the widget under test inside of the tree
class _SnapshotSubject extends StatelessWidget {
  const _SnapshotSubject({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) => child;
}

/// Whether [path] contains a file
bool _pathExists(String path) {
  final comparator = goldenFileComparator;
  // Nothing to report: an update run is about to write the file, and a custom
  // comparator resolves paths its own way.
  if (autoUpdateGoldenFiles || comparator is! LocalFileComparator) {
    return true;
  }

  return File.fromUri(comparator.basedir.resolve(path)).existsSync();
}
