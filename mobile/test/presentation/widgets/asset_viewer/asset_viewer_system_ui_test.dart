import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.page.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

import '../../../fixtures/asset.stub.dart';

class _SeededAssetViewerNotifier extends AssetViewerStateNotifier {
  @override
  AssetViewerState build() {
    super.build();
    return AssetViewerState(currentAsset: LocalAssetStub.image1);
  }
}

TimelineService _stubTimelineService() {
  return TimelineService((
    assetSource: (index, count) async => [LocalAssetStub.image1],
    bucketSource: () => Stream.value(const [Bucket(assetCount: 1)]),
    origin: TimelineOrigin.main,
  ));
}

void main() {
  testWidgets('status bar icons are light while the asset viewer is open in light mode', (tester) async {
    // Emulate arriving from a light-themed page whose AppBar set dark status
    // bar icons (the state the viewer is opened from in light mode).
    SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle.dark);

    await tester.pumpWidget(
      EasyLocalization(
        supportedLocales: locales.values.toList(),
        path: translationsPath,
        startLocale: locales.values.first,
        fallbackLocale: locales.values.first,
        saveLocale: false,
        useFallbackTranslations: true,
        assetLoader: const CodegenLoader(),
        child: ProviderScope(
          overrides: [
            timelineServiceProvider.overrideWithValue(_stubTimelineService()),
            assetViewerProvider.overrideWith(_SeededAssetViewerNotifier.new),
          ],
          child: Builder(
            builder: (context) => MaterialApp(
              debugShowCheckedModeBanner: false,
              localizationsDelegates: context.localizationDelegates,
              supportedLocales: context.supportedLocales,
              locale: context.locale,
              home: const Material(child: AssetViewer(initialIndex: 0)),
            ),
          ),
        ),
      ),
    );

    // Let post-frame callbacks and the initial frames run without waiting for
    // infinite animations (loading spinners) to settle.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));

    // Asset thumbnails cannot load in the test environment (no platform
    // channels / real HTTP). Those image errors are irrelevant to the system
    // chrome behaviour under test, so drain them.
    tester.takeException();

    expect(
      SystemChrome.latestStyle?.statusBarIconBrightness,
      Brightness.light,
      reason:
          'The asset viewer draws over a black background, so status bar '
          'icons must be light regardless of the app theme',
    );
  });
}
