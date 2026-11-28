import 'dart:async';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.page.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/video_viewer.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../../fixtures/asset.stub.dart';
import '../../../unit/presentation/presentation_context.dart';

const _assetCount = 2000;
const _farIndex = 1500;
const _pastScrubSettle = Durations.medium2;
const _videoIndex = 5;

final _assets = List<BaseAsset>.generate(
  _assetCount,
  (i) => LocalAssetStub.image1.copyWith(id: 'asset-$i', type: i == _videoIndex ? AssetType.video : AssetType.image),
);

class _OpenedAssetViewerNotifier extends AssetViewerStateNotifier {
  @override
  AssetViewerState build() {
    super.build();
    return AssetViewerState(currentAsset: _assets.first);
  }
}

void main() {
  late PresentationContext context;

  setUpAll(() => registerFallbackValue(LocalAssetStub.image1));

  setUp(() async {
    context = await PresentationContext.create();
    when(() => context.service.asset.service.watchAsset(any())).thenAnswer((_) => const Stream.empty());
    when(
      () => context.service.asset.service.getAsset(any()),
    ).thenAnswer((call) async => call.positionalArguments.first);
  });

  tearDown(() async {
    await context.dispose();
  });

  Future<ProviderContainer> pumpViewer(WidgetTester tester, TimelineService timeline) async {
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
            assetViewerProvider.overrideWith(_OpenedAssetViewerNotifier.new),
          ],
          child: Builder(
            builder: (context) => MaterialApp(
              localizationsDelegates: context.localizationDelegates,
              supportedLocales: context.supportedLocales,
              locale: context.locale,
              home: const Material(child: AssetViewer()),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    return ProviderScope.containerOf(tester.element(find.byType(AssetViewer)));
  }

  testWidgets('a slow far asset does not replace the asset scrubbed to after it', (tester) async {
    final farLoad = Completer<void>();
    final timeline = TimelineService((
      assetSource: (offset, count) async {
        if (offset > 0) {
          await farLoad.future;
        }
        return _assets.skip(offset).take(count).toList();
      },
      bucketSource: () => Stream.value(const [Bucket(assetCount: _assetCount)]),
      origin: TimelineOrigin.main,
    ));
    addTearDown(timeline.dispose);
    await tester.pump();
    final container = await pumpViewer(tester, timeline);

    container.read(assetViewerProvider.notifier).setCurrentIndex(_farIndex);
    await tester.pump(_pastScrubSettle);
    container.read(assetViewerProvider.notifier).setCurrentIndex(1);
    await tester.pump(_pastScrubSettle);
    expect(container.read(assetViewerProvider).currentAsset?.id, 'asset-1');

    farLoad.complete();
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));
    tester.takeException();

    expect(container.read(assetViewerProvider).currentIndex, 1);
    expect(container.read(assetViewerProvider).currentAsset?.id, 'asset-1');
  });

  testWidgets('a far photo scrubbed onto before its load finishes shows once it loads', (tester) async {
    final farLoad = Completer<void>();
    final timeline = TimelineService((
      assetSource: (offset, count) async {
        if (offset > 0) {
          await farLoad.future;
        }
        return _assets.skip(offset).take(count).toList();
      },
      bucketSource: () => Stream.value(const [Bucket(assetCount: _assetCount)]),
      origin: TimelineOrigin.main,
    ));
    addTearDown(timeline.dispose);
    await tester.pump();
    final container = await pumpViewer(tester, timeline);
    await tester.pump(_pastScrubSettle);

    container.read(assetViewerProvider.notifier).setCurrentIndex(_farIndex);
    await tester.pump(_pastScrubSettle);
    farLoad.complete();
    await tester.pump();
    await tester.pump();
    tester.takeException();

    expect(find.byKey(Key(_assets[_farIndex].heroTag)), findsOneWidget);
  });

  testWidgets('actions mid scrub target the photo shown, not the one the scrub started on', (tester) async {
    final timeline = TimelineService((
      assetSource: (offset, count) async => _assets.skip(offset).take(count).toList(),
      bucketSource: () => Stream.value(const [Bucket(assetCount: _assetCount)]),
      origin: TimelineOrigin.main,
    ));
    addTearDown(timeline.dispose);
    await tester.pump();
    final container = await pumpViewer(tester, timeline);
    await tester.pump(_pastScrubSettle);

    container.read(assetViewerProvider.notifier).setCurrentIndex(5);
    await tester.pump(const Duration(milliseconds: 16));
    container.read(assetViewerProvider.notifier).setCurrentIndex(6);
    await tester.pump(const Duration(milliseconds: 16));
    tester.takeException();

    expect(container.read(assetViewerProvider).currentAsset?.id, 'asset-6');
  });

  testWidgets('swiping the photo shares its live page and clears it once the swipe settles', (tester) async {
    final timeline = TimelineService((
      assetSource: (offset, count) async => _assets.skip(offset).take(count).toList(),
      bucketSource: () => Stream.value(const [Bucket(assetCount: _assetCount)]),
      origin: TimelineOrigin.main,
    ));
    addTearDown(timeline.dispose);
    await tester.pump();
    final container = await pumpViewer(tester, timeline);
    await tester.pump(_pastScrubSettle);
    final swipePage = container.read(viewerSwipePageProvider);
    final pages = <double?>[];
    swipePage.addListener(() => pages.add(swipePage.value));

    final gesture = await tester.startGesture(tester.getCenter(find.byType(PageView)));
    for (var i = 0; i < 16; i++) {
      await gesture.moveBy(const Offset(-30, 0));
      await tester.pump(const Duration(milliseconds: 16));
    }
    final midSwipe = swipePage.value;
    await gesture.up();
    for (var i = 0; i < 60; i++) {
      await tester.pump(const Duration(milliseconds: 16));
    }
    tester.takeException();

    expect(midSwipe, isNotNull);
    expect(midSwipe, greaterThan(0));
    expect(midSwipe, lessThan(1));
    expect(pages.last, isNull);
    expect(container.read(assetViewerProvider).currentIndex, 1);
  });

  testWidgets('jumping the photo from the filmstrip shares no swipe page', (tester) async {
    final timeline = TimelineService((
      assetSource: (offset, count) async => _assets.skip(offset).take(count).toList(),
      bucketSource: () => Stream.value(const [Bucket(assetCount: _assetCount)]),
      origin: TimelineOrigin.main,
    ));
    addTearDown(timeline.dispose);
    await tester.pump();
    final container = await pumpViewer(tester, timeline);
    final swipePage = container.read(viewerSwipePageProvider);
    final pages = <double?>[];
    swipePage.addListener(() => pages.add(swipePage.value));

    container.read(assetViewerProvider.notifier).setCurrentIndex(5);
    await tester.pump(_pastScrubSettle);
    tester.takeException();

    expect(pages, isEmpty);
  });

  group('a video the filmstrip scrubs onto', () {
    Future<ProviderContainer> pumpScrubbable(WidgetTester tester) async {
      final timeline = TimelineService((
        assetSource: (offset, count) async => _assets.skip(offset).take(count).toList(),
        bucketSource: () => Stream.value(const [Bucket(assetCount: _assetCount)]),
        origin: TimelineOrigin.main,
      ));
      addTearDown(timeline.dispose);
      await tester.pump();
      final container = await pumpViewer(tester, timeline);
      await tester.pump(_pastScrubSettle);
      return container;
    }

    testWidgets('stays a still image while the scrub passes over it', (tester) async {
      final container = await pumpScrubbable(tester);

      container.read(assetViewerProvider.notifier).setCurrentIndex(_videoIndex);
      await tester.pump(const Duration(milliseconds: 16));
      await tester.pump(const Duration(milliseconds: 16));
      tester.takeException();

      expect(container.read(assetViewerProvider).currentAsset?.id, 'asset-$_videoIndex');
      expect(find.byType(NativeVideoViewer), findsNothing);
    });

    testWidgets('gets its player once the scrub pauses on it', (tester) async {
      final container = await pumpScrubbable(tester);

      container.read(assetViewerProvider.notifier).setCurrentIndex(_videoIndex);
      await tester.pump(_pastScrubSettle);
      await tester.pump();
      tester.takeException();

      expect(tester.widget<NativeVideoViewer>(find.byType(NativeVideoViewer)).isCurrent, isTrue);
    });
  });
}
