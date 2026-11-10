import 'dart:async';
import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail_tile.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:mocktail/mocktail.dart';

import '../../../fixtures/asset.stub.dart';
import '../../../unit/presentation/presentation_context.dart';

void main() {
  final assets = List<BaseAsset>.generate(200, (i) => LocalAssetStub.image1.copyWith(id: 'a$i'));

  setUpAll(() => registerFallbackValue(LocalAssetStub.image1));

  // the bars of the main page and of an album, under the phone's status bar and above its gesture bar
  Future<StackRouter> pumpPage(WidgetTester tester, {required bool album}) async {
    final context = await PresentationContext.create();
    addTearDown(context.dispose);
    when(() => context.service.asset.service.watchAsset(any())).thenAnswer((_) => const Stream.empty());
    tester.view.devicePixelRatio = 3.0;
    tester.view.physicalSize = const Size(1206, 2622);
    tester.view.padding = const FakeViewPadding(top: 90, bottom: 72);
    addTearDown(tester.view.reset);

    final service = TimelineService((
      assetSource: (i, n) async => assets.sublist(i, math.min(i + n, assets.length)),
      bucketSource: () => Stream.value([TimeBucket(date: DateTime(2025), assetCount: assets.length)]),
      origin: TimelineOrigin.main,
    ));
    addTearDown(service.dispose);

    final router = RootStackRouter.build(
      routes: [
        AutoRoute(
          initial: true,
          page: PageInfo(
            'Timeline',
            builder: (_) => Scaffold(
              body: Timeline(
                withScrubber: false,
                groupBy: GroupAssetsBy.none,
                appBar: album
                    ? const SliverAppBar(pinned: true, expandedHeight: 400, title: Text('album'))
                    : const SliverAppBar(floating: true, title: Text('photos')),
              ),
              bottomNavigationBar: album
                  ? null
                  : NavigationBar(
                      destinations: const [
                        NavigationDestination(icon: Icon(Icons.photo), label: 'photos'),
                        NavigationDestination(icon: Icon(Icons.search), label: 'search'),
                      ],
                    ),
            ),
          ),
        ),
        AutoRoute(
          path: '/other',
          page: PageInfo('Other', builder: (_) => const Scaffold()),
        ),
        AutoRoute(page: AssetViewerRoute.page),
      ],
    );

    await tester.pumpTestWidget(
      context,
      Router.withConfig(config: router.config()),
      overrides: [
        timelineServiceProvider.overrideWithValue(service),
        appConfigProvider.overrideWithValue(const AppConfig()),
      ],
      expectSettle: false,
    );
    // Segment stream resolves, then the first buffer
    await tester.pump();
    await tester.pump();
    return router;
  }

  ScrollPosition timelinePosition(WidgetTester tester) => tester
      .state<ScrollableState>(find.descendant(of: find.byType(Timeline), matching: find.byType(Scrollable)).first)
      .position;

  Finder tile(int index) => find.byWidgetPredicate((w) => w is ThumbnailTile && w.asset?.id == 'a$index');

  Rect? tileRect(WidgetTester tester, int index) => tile(index).evaluate().isEmpty ? null : tester.getRect(tile(index));

  Future<void> closeViewerOn(WidgetTester tester, int index) async {
    EventStream.shared.emit(ViewerClosedEvent(assets[index]));
    await tester.pumpAndSettle();
  }

  Future<void> openViewer(WidgetTester tester, int index) async {
    await tester.tap(tile(index));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));
  }

  testWidgets('a closed viewer brings its photo fully into view between the bars of the page', (tester) async {
    final router = await pumpPage(tester, album: false);
    final position = timelinePosition(tester);
    final navigationBarTop = tester.getRect(find.byType(NavigationBar)).top;

    position.jumpTo(1500);
    await tester.pumpAndSettle();
    final scrolled = position.pixels;

    final shown = List.generate(assets.length, (i) => i).firstWhere((i) {
      final rect = tileRect(tester, i);
      return rect != null && rect.top > 30 && rect.bottom < navigationBarTop;
    });
    await closeViewerOn(tester, shown);
    expect(position.pixels, scrolled, reason: 'a photo fully on screen does not move the timeline');

    await closeViewerOn(tester, 150);
    expect(tileRect(tester, 150)!.bottom, lessThanOrEqualTo(navigationBarTop), reason: 'not behind the tab bar');

    final before = position.pixels;
    unawaited(router.pushPath('/other'));
    await tester.pumpAndSettle();
    await closeViewerOn(tester, 0);
    expect(position.pixels, before, reason: 'a timeline under another page does not move');
  });

  testWidgets('a closed viewer brings its photo fully into view below a pinned album header', (tester) async {
    await pumpPage(tester, album: true);

    await closeViewerOn(tester, 150);
    expect(tileRect(tester, 150)!.bottom, lessThanOrEqualTo(874 - 24), reason: 'not under the gesture bar');

    await closeViewerOn(tester, 100);
    final headerBottom = tester.getRect(find.byType(AppBar)).bottom;
    expect(tileRect(tester, 100)!.top, greaterThanOrEqualTo(headerBottom), reason: 'not under the pinned header');
  });

  testWidgets('closing the viewer opened from a tile brings the photo it shows into view', (tester) async {
    final router = await pumpPage(tester, album: false);
    timelinePosition(tester).jumpTo(1500);
    await tester.pumpAndSettle();
    final opened = List.generate(assets.length, (i) => i).firstWhere((i) => (tileRect(tester, i)?.top ?? 0) > 30);
    expect(tileRect(tester, opened - 8), isNull);

    await openViewer(tester, opened);
    for (var i = 0; i < 8; i++) {
      await tester.drag(find.byType(PageView), const Offset(500, 0));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 600));
    }
    unawaited(router.maybePop());
    await tester.pump();

    expect(tileRect(tester, opened - 8)!.top, greaterThanOrEqualTo(30), reason: 'in place on the first close frame');
  });

  testWidgets('the viewer reports the photo it shows when it closes, also in the middle of a swipe', (tester) async {
    final router = await pumpPage(tester, album: false);
    final closed = <ViewerClosedEvent>[];
    final subscription = EventStream.shared.listen<ViewerClosedEvent>(closed.add);
    addTearDown(subscription.cancel);

    await openViewer(tester, 0);
    // past half a page, so the swipe settles on the next photo, but closed before it has settled
    await tester.drag(find.byType(PageView), const Offset(-500, 0));
    await tester.pump();
    unawaited(router.maybePop());
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    expect(closed, hasLength(1));
    expect(closed.single.asset, assets[1]);
  });
}
