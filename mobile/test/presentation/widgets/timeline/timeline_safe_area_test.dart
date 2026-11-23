import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/scrubber.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

import '../../../fixtures/asset.stub.dart';

const _devicePixelRatio = 3.0;

Future<void> _pumpScrolledTimeline(
  WidgetTester tester, {
  required Size size,
  required EdgeInsets inset,
  TextDirection textDirection = TextDirection.ltr,
  Widget appBar = const SliverToBoxAdapter(child: SizedBox.shrink()),
}) async {
  tester.view.devicePixelRatio = _devicePixelRatio;
  tester.view.physicalSize = size * _devicePixelRatio;
  tester.view.padding = FakeViewPadding(
    left: inset.left * _devicePixelRatio,
    top: inset.top * _devicePixelRatio,
    right: inset.right * _devicePixelRatio,
    bottom: inset.bottom * _devicePixelRatio,
  );
  addTearDown(tester.view.reset);

  final assets = List<BaseAsset>.generate(200, (i) => LocalAssetStub.image1.copyWith(id: 'a$i'));
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
          builder: (_) => Timeline(readOnly: true, groupBy: GroupAssetsBy.none, appBar: appBar),
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
      child: MaterialApp.router(
        routerConfig: router.config(),
        builder: (_, child) => Directionality(textDirection: textDirection, child: child!),
      ),
    ),
  );
  await tester.pump();
  await tester.pump();
  tester.takeException();

  await tester.drag(find.byType(CustomScrollView), const Offset(0, -300));
  await tester.pump(kTimelineScrubberFadeInDuration);
  tester.takeException();
}

Rect _thumbRect(WidgetTester tester) => tester.getRect(
  find.descendant(
    of: find.byType(Scrubber),
    matching: find.byWidgetPredicate((widget) => widget is GestureDetector && widget.onVerticalDragStart != null),
  ),
);

Rect _gridRect(WidgetTester tester) => tester.getRect(find.byType(CustomScrollView));

void main() {
  testWidgets('scrubber stays clear of a status bar on the right edge', (tester) async {
    await _pumpScrolledTimeline(tester, size: const Size(466, 678), inset: const EdgeInsets.only(right: 84));

    expect(_thumbRect(tester).right, 382);
    expect(_gridRect(tester).right, 382);
  });

  testWidgets('start side inset is left to the navigation rail', (tester) async {
    await _pumpScrolledTimeline(tester, size: const Size(874, 402), inset: const EdgeInsets.symmetric(horizontal: 62));

    expect(_gridRect(tester).left, 0);
    expect(_thumbRect(tester).right, 812);
  });

  testWidgets('scrubber stays clear of a status bar on the end edge in right to left layouts', (tester) async {
    await _pumpScrolledTimeline(
      tester,
      size: const Size(466, 678),
      inset: const EdgeInsets.only(left: 84),
      textDirection: TextDirection.rtl,
    );

    expect(_thumbRect(tester).left, 84);
    expect(_gridRect(tester).left, 84);
  });

  testWidgets('status bar text turns light over the black end bar', (tester) async {
    await _pumpScrolledTimeline(
      tester,
      size: const Size(466, 678),
      inset: const EdgeInsets.only(right: 84),
      appBar: const SliverAppBar(pinned: true, title: Text('Photos')),
    );

    expect(SystemChrome.latestStyle?.statusBarBrightness, Brightness.dark);
  });

  testWidgets('status bar keeps the app bar style without an end inset', (tester) async {
    await _pumpScrolledTimeline(
      tester,
      size: const Size(402, 874),
      inset: const EdgeInsets.only(top: 62),
      appBar: const SliverAppBar(pinned: true, title: Text('Photos')),
    );

    expect(SystemChrome.latestStyle?.statusBarBrightness, Brightness.light);
  });
}
