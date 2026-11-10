import 'dart:async';
import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.page.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail_tile.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../../fixtures/asset.stub.dart';
import '../../../unit/presentation/presentation_context.dart';

TimelineService _serviceOf(List<BaseAsset> assets) => TimelineService((
  assetSource: (i, n) async => assets.sublist(i, math.min(i + n, assets.length)),
  bucketSource: () => Stream.value([TimeBucket(date: DateTime(2025), assetCount: assets.length)]),
  origin: TimelineOrigin.main,
));

class _SeededAssetViewerNotifier extends AssetViewerStateNotifier {
  @override
  AssetViewerState build() {
    super.build();
    return AssetViewerState(currentAsset: LocalAssetStub.image1);
  }
}

void main() {
  final assets = List<BaseAsset>.generate(200, (i) => LocalAssetStub.image1.copyWith(id: 'a$i'));

  setUpAll(() => registerFallbackValue(LocalAssetStub.image1));

  testWidgets('a closed viewer brings its last asset into view on the timeline that opened it', (tester) async {
    tester.view.devicePixelRatio = 3.0;
    tester.view.physicalSize = const Size(1206, 2622);
    addTearDown(tester.view.reset);

    final service = _serviceOf(assets);
    final otherService = _serviceOf(assets);
    addTearDown(service.dispose);
    addTearDown(otherService.dispose);

    final router = RootStackRouter.build(
      routes: [
        AutoRoute(
          initial: true,
          page: PageInfo(
            'Timeline',
            builder: (_) => const Timeline(
              withScrubber: false,
              readOnly: true,
              groupBy: GroupAssetsBy.none,
              // taller than the screen, so the jump must count the space above the grid
              appBar: SliverToBoxAdapter(child: SizedBox(height: 900)),
            ),
          ),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          timelineServiceProvider.overrideWithValue(service),
          appConfigProvider.overrideWithValue(const AppConfig()),
        ],
        child: MaterialApp.router(routerConfig: router.config()),
      ),
    );
    await tester.pump();
    await tester.pump();

    final timeline = find.byType(Timeline);
    final position = tester
        .state<ScrollableState>(find.descendant(of: timeline, matching: find.byType(Scrollable)).first)
        .position;
    bool fullyVisible(String id) {
      final tile = find.byWidgetPredicate((w) => w is ThumbnailTile && w.asset?.id == id);
      if (tile.evaluate().isEmpty) {
        return false;
      }
      final screen = tester.getRect(timeline);
      final rect = tester.getRect(tile);
      return rect.top >= screen.top && rect.bottom <= screen.bottom;
    }

    Future<void> closeViewer(TimelineService opener, int index) async {
      EventStream.shared.emit(ViewerClosedEvent(opener, index));
      await tester.pumpAndSettle();
    }

    await tester.drag(timeline, const Offset(0, -600));
    await tester.pumpAndSettle();
    final scrolled = position.pixels;
    expect(fullyVisible('a120'), isFalse);

    await closeViewer(otherService, 120);
    expect(position.pixels, scrolled, reason: 'a viewer opened from another timeline does not move this one');

    await closeViewer(service, 12);
    expect(position.pixels, scrolled, reason: 'an asset fully on screen does not move the timeline');

    expect(fullyVisible('a20'), isFalse);
    await closeViewer(service, 20);
    expect(fullyVisible('a20'), isTrue, reason: 'an asset cut by the bottom edge is brought fully into view');

    await closeViewer(service, 120);
    expect(fullyVisible('a120'), isTrue, reason: 'the timeline shows the asset the viewer closed on');
  });

  testWidgets('the viewer reports the page it closes on', (tester) async {
    final context = await PresentationContext.create();
    addTearDown(context.dispose);
    when(() => context.service.asset.service.watchAsset(any())).thenAnswer((_) => const Stream.empty());

    final service = _serviceOf(assets.take(3).toList());
    addTearDown(service.dispose);
    final closed = <ViewerClosedEvent>[];
    final subscription = EventStream.shared.listen<ViewerClosedEvent>(closed.add);
    addTearDown(subscription.cancel);

    await tester.pumpTestWidget(
      context,
      const SizedBox.shrink(),
      overrides: [
        timelineServiceProvider.overrideWithValue(service),
        assetViewerProvider.overrideWith(_SeededAssetViewerNotifier.new),
      ],
    );

    final navigator = tester.state<NavigatorState>(find.byType(Navigator));
    unawaited(navigator.push(MaterialPageRoute(builder: (_) => const Material(child: AssetViewer(initialIndex: 0)))));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));

    await tester.drag(find.byType(PageView), const Offset(-500, 0));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));

    navigator.pop();
    await tester.pump();
    await tester.pump(const Duration(seconds: 1));

    expect(closed, hasLength(1));
    expect(closed.single.timelineService, service);
    expect(closed.single.index, 1);
  });
}
