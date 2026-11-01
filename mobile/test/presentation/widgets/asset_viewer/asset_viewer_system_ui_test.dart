import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.page.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

import '../../../fixtures/asset.stub.dart';
import '../../../unit/presentation/presentation_context.dart';

class _SeededAssetViewerNotifier extends AssetViewerStateNotifier {
  @override
  AssetViewerState build() {
    super.build();
    return AssetViewerState(currentAsset: LocalAssetStub.image1);
  }
}

TimelineService _stubTimelineService([TimelineOrigin origin = TimelineOrigin.main]) {
  return TimelineService((
    assetSource: (index, count) async => [LocalAssetStub.image1],
    bucketSource: () => Stream.value(const [Bucket(assetCount: 1)]),
    origin: origin,
  ));
}

void main() {
  late PresentationContext context;

  setUp(() async {
    context = await PresentationContext.create();
  });

  tearDown(() async {
    await context.dispose();
  });

  for (final (origin, covered) in [
    (TimelineOrigin.search, false),
    (TimelineOrigin.search, true),
    (TimelineOrigin.privateTag, false),
    (TimelineOrigin.privateTag, true),
    (TimelineOrigin.localAlbum, false),
    (TimelineOrigin.localAlbum, true),
  ]) {
    testWidgets('privacy changes clear snapshot viewers except device albums: $origin, covered=$covered', (
      tester,
    ) async {
      final timeline = _stubTimelineService(origin);
      addTearDown(timeline.dispose);
      final router = RootStackRouter.build(
        routes: [
          NamedRouteDef(
            name: 'home',
            path: '/',
            builder: (_, _) => const Scaffold(body: Text('Home')),
          ),
          NamedRouteDef(
            name: 'viewer',
            path: '/viewer',
            builder: (_, _) => const Material(child: AssetViewer(initialIndex: 0)),
          ),
          NamedRouteDef(
            name: 'cover',
            path: '/cover',
            builder: (_, _) => const Scaffold(body: Text('Cover')),
          ),
        ],
      );
      addTearDown(router.dispose);
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
              ...context.overrides,
              timelineServiceProvider.overrideWithValue(timeline),
              assetViewerProvider.overrideWith(_SeededAssetViewerNotifier.new),
            ],
            child: Builder(
              builder: (context) => MaterialApp.router(
                routerConfig: router.config(),
                localizationsDelegates: context.localizationDelegates,
                supportedLocales: context.supportedLocales,
                locale: context.locale,
              ),
            ),
          ),
        ),
      );
      await tester.pump();
      unawaited(router.pushPath('/viewer'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 600));
      tester.takeException();
      expect(find.byType(AssetViewer), findsOneWidget);
      if (covered) {
        unawaited(router.pushPath('/cover'));
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 600));
      }

      EventStream.shared.emit(const AssetAccessChangedEvent());
      EventStream.shared.emit(const AssetAccessChangedEvent());
      if (origin != TimelineOrigin.localAlbum) {
        EventStream.shared.emit(const TimelineReloadEvent());
      }
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 600));
      if (covered) {
        expect(router.current.name, 'cover');
        unawaited(router.maybePop());
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 600));
      }

      expect(router.current.name, origin == TimelineOrigin.localAlbum ? 'viewer' : 'home');
      expect(find.byType(AssetViewer), origin == TimelineOrigin.localAlbum ? findsOneWidget : findsNothing);
    });
  }

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
            ...context.overrides,
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
