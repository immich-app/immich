import 'dart:async';
import 'dart:math' as math;

import 'package:drift/drift.dart';
import 'package:drift/native.dart';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline_drag_region.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

import '../../../fixtures/asset.stub.dart';

class _StubRouterDelegate extends RouterDelegate<void> with ChangeNotifier {
  _StubRouterDelegate(this.child);

  final Widget child;

  @override
  Widget build(BuildContext context) => child;

  @override
  Future<bool> popRoute() => Future.value(false);

  @override
  Future<void> setNewRoutePath(void configuration) => Future.value();
}

Widget _withRouter(Widget child) =>
    Router<void>(routerDelegate: _StubRouterDelegate(child), backButtonDispatcher: RootBackButtonDispatcher());

void main() {
  const assetCount = 1500;
  late TimelineService service;
  Completer<void>? loadGate;

  setUpAll(() async {
    final db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: StoreRepository(db), listenUpdates: false);
  });

  void expectSelectedRange(ProviderContainer container, int from, int to) {
    final selected = container.read(multiSelectProvider).selectedAssets.map((asset) => asset.id).toSet();
    expect(selected, {for (var i = from; i <= to; i++) 'a$i'});
  }

  Finder tile(int assetIndex) =>
      find.byWidgetPredicate((widget) => widget is TimelineAssetIndexWrapper && widget.assetIndex == assetIndex);

  Future<ProviderContainer> pumpTimeline(
    WidgetTester tester, {
    Widget? bottomSheet,
    List<Bucket>? buckets,
    TextDirection textDirection = TextDirection.ltr,
  }) async {
    tester.view.devicePixelRatio = 3.0;
    tester.view.physicalSize = const Size(1206, 2622);
    addTearDown(tester.view.reset);

    final assets = List<BaseAsset>.generate(assetCount, (i) => LocalAssetStub.image1.copyWith(id: 'a$i'));
    service = TimelineService((
      assetSource: (i, n) async {
        final gate = loadGate;
        if (gate != null) {
          loadGate = null;
          await gate.future;
        }
        return assets.sublist(i, math.min(i + n, assets.length));
      },
      bucketSource: () => Stream.value(buckets ?? [TimeBucket(date: DateTime(2025), assetCount: assets.length)]),
      origin: TimelineOrigin.main,
    ));
    addTearDown(service.dispose);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          timelineServiceProvider.overrideWithValue(service),
          appConfigProvider.overrideWithValue(const AppConfig()),
        ],
        child: MaterialApp(
          home: Directionality(
            textDirection: textDirection,
            child: _withRouter(
              Timeline(withScrubber: false, groupBy: GroupAssetsBy.none, appBar: null, bottomSheet: bottomSheet),
            ),
          ),
        ),
      ),
    );
    // segments, then the asset buffer
    await tester.pump();
    await tester.pump();
    // thumbnails cannot load in tests
    tester.takeException();

    return ProviderScope.containerOf(tester.element(find.byType(Timeline)));
  }

  // the lowest tile the viewport still shows, which is inside the auto scroll zone at the bottom
  Offset lowestTileCenter(WidgetTester tester, Rect grid) {
    Offset? lowest;
    for (final element in find.byType(TimelineAssetIndexWrapper).evaluate()) {
      final box = element.renderObject! as RenderBox;
      final center = box.localToGlobal(box.size.center(Offset.zero));
      if (center.dy < grid.bottom && (lowest == null || center.dy > lowest.dy)) {
        lowest = center;
      }
    }
    return lowest!;
  }

  Future<TestGesture> startDragOn(WidgetTester tester, int assetIndex) async {
    final gesture = await tester.startGesture(tester.getCenter(tile(assetIndex)));
    await tester.pump(kLongPressTimeout + const Duration(milliseconds: 50));
    return gesture;
  }

  testWidgets('drag selection keeps extending after the buffer moved past the anchor', (tester) async {
    final container = await pumpTimeline(tester);
    final gesture = await startDragOn(tester, 0);

    await gesture.moveTo(tester.getCenter(tile(8)));
    await tester.pump();
    expectSelectedRange(container, 0, 8);

    // the timeline loaded a far away part of the library, so the dragged range is no longer in memory
    await service.loadAssets(assetCount - 100, 4);
    expect(service.hasRange(0, 13), isFalse);

    await gesture.moveTo(tester.getCenter(tile(12)));
    await tester.pump();
    expectSelectedRange(container, 0, 12);

    await gesture.up();
    await tester.pump(const Duration(seconds: 1));
  });

  testWidgets('drag selection keeps growing while the finger rests in the auto scroll zone', (tester) async {
    final container = await pumpTimeline(tester);
    final gesture = await startDragOn(tester, 0);

    final grid = tester.getRect(find.byType(Timeline));
    final parked = lowestTileCenter(tester, grid);
    expect(parked.dy, greaterThan(grid.top + grid.height * 0.9), reason: 'inside the auto scroll zone');

    await gesture.moveTo(parked);
    await tester.pump();
    final selectedAtEdge = container.read(multiSelectProvider).selectedAssets.length;
    expect(selectedAtEdge, greaterThan(1));

    // the finger stays where it is, the rows move under it
    for (var i = 0; i < 30; i++) {
      await tester.pump(const Duration(milliseconds: 16));
    }
    final grown = container.read(multiSelectProvider).selectedAssets.length;
    expect(grown, greaterThan(selectedAtEdge));
    expectSelectedRange(container, 0, grown - 1);

    await gesture.up();
    await tester.pump(const Duration(seconds: 1));
  });

  testWidgets('drag selection keeps growing while the finger rests on the selection sheet', (tester) async {
    final container = await pumpTimeline(
      tester,
      bottomSheet: const Positioned(
        bottom: 0,
        left: 0,
        right: 0,
        height: 260,
        child: ColoredBox(color: Color(0xFF000000)),
      ),
    );
    final gesture = await startDragOn(tester, 0);
    // the sheet only shows up once the long press selected something
    await tester.pump();

    final grid = tester.getRect(find.byType(Timeline));
    // the same column as the anchor, 10px above the bottom, which the sheet covers
    await gesture.moveTo(Offset(tester.getCenter(tile(0)).dx, grid.bottom - 10));
    await tester.pump();
    final selectedOnSheet = container.read(multiSelectProvider).selectedAssets.length;
    expect(selectedOnSheet, greaterThan(1), reason: 'reached the last row above the sheet');

    // the finger stays on the sheet, the rows move behind it
    for (var i = 0; i < 30; i++) {
      await tester.pump(const Duration(milliseconds: 16));
    }
    final grown = container.read(multiSelectProvider).selectedAssets.length;
    expect(grown, greaterThan(selectedOnSheet));
    expectSelectedRange(container, 0, grown - 1);

    await gesture.up();
    await tester.pump(const Duration(seconds: 1));
  });

  testWidgets('drag selection enters a row whose only tile sits in another column', (tester) async {
    // the middle day holds a single photo, so the rest of that row is empty
    final container = await pumpTimeline(
      tester,
      buckets: [
        TimeBucket(date: DateTime(2025, 3), assetCount: 8),
        TimeBucket(date: DateTime(2025, 2), assetCount: 1),
        TimeBucket(date: DateTime(2025), assetCount: assetCount - 9),
      ],
    );
    final gesture = await startDragOn(tester, 16);

    // straight up the last column, to the height of the lone photo where that row has nothing
    await gesture.moveTo(Offset(tester.getCenter(tile(16)).dx, tester.getCenter(tile(8)).dy));
    await tester.pump();
    expectSelectedRange(container, 8, 16);

    await gesture.up();
    await tester.pump(const Duration(seconds: 1));
  });

  testWidgets('drag selection enters a short row from the gap side under rtl', (tester) async {
    final container = await pumpTimeline(
      tester,
      textDirection: TextDirection.rtl,
      buckets: [
        TimeBucket(date: DateTime(2025, 3), assetCount: 8),
        TimeBucket(date: DateTime(2025, 2), assetCount: 1),
        TimeBucket(date: DateTime(2025), assetCount: assetCount - 9),
      ],
    );
    final gesture = await startDragOn(tester, 16);

    // rtl mirrors the grid: the lone photo hugs the right edge and its row's gap is on the left
    final grid = tester.getRect(find.byType(Timeline));
    final onGap = Offset(tester.getCenter(tile(16)).dx, tester.getCenter(tile(8)).dy);
    expect(onGap.dx, lessThan(grid.center.dx), reason: 'the finger comes up the mirrored last column');

    await gesture.moveTo(onGap);
    await tester.pump();
    expectSelectedRange(container, 8, 16);

    await gesture.up();
    await tester.pump(const Duration(seconds: 1));
  });

  testWidgets('extending the range notifies the selection once', (tester) async {
    final container = await pumpTimeline(tester);
    var notifications = 0;
    container.listen(multiSelectProvider, (_, _) => notifications++);

    final gesture = await startDragOn(tester, 0);
    // the long press selects the anchor through the tile itself
    final afterAnchor = notifications;

    await gesture.moveTo(tester.getCenter(tile(8)));
    await tester.pump();

    expectSelectedRange(container, 0, 8);
    expect(notifications - afterAnchor, 1);

    await gesture.up();
    await tester.pump(const Duration(seconds: 1));
  });

  testWidgets('a range that arrives after the finger lifted is dropped', (tester) async {
    final container = await pumpTimeline(tester);
    final gesture = await startDragOn(tester, 0);

    await gesture.moveTo(tester.getCenter(tile(8)));
    await tester.pump();
    await service.loadAssets(assetCount - 100, 4);

    final gate = Completer<void>();
    loadGate = gate;
    await gesture.moveTo(tester.getCenter(tile(12)));
    await tester.pump();
    await gesture.up();
    await tester.pump();

    gate.complete();
    await tester.pump(const Duration(seconds: 1));
    expectSelectedRange(container, 0, 8);
  });
}
