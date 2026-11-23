import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/scrubber.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:mocktail/mocktail.dart';

import '../../../fixtures/asset.stub.dart';
import '../../../service.mocks.dart';

void main() {
  testWidgets('dragging the thumb to the bottom scrolls to the end when the oldest month is taller than the screen', (
    tester,
  ) async {
    tester.view.devicePixelRatio = 3.0;
    tester.view.physicalSize = const Size(1206, 2622);
    tester.view.padding = const FakeViewPadding(top: 186, bottom: 102);
    addTearDown(tester.view.reset);

    final buckets = [
      for (var month = 12; month >= 1; month--) TimeBucket(date: DateTime(2025, month), assetCount: 6),
      TimeBucket(date: DateTime(2024, 12), assetCount: 300),
    ];
    final assets = List<BaseAsset>.generate(372, (i) => LocalAssetStub.image1.copyWith(id: 'a$i'));
    final service = TimelineService((
      assetSource: (i, n) async => assets.sublist(i, math.min(i + n, assets.length)),
      bucketSource: () => Stream.value(buckets),
      origin: TimelineOrigin.main,
    ));
    addTearDown(service.dispose);

    final appSettings = MockAppSettingsService();
    when(() => appSettings.getSetting(AppSettingsEnum.enableHapticFeedback)).thenReturn(false);

    final router = RootStackRouter.build(
      routes: [
        AutoRoute(
          initial: true,
          page: PageInfo(
            'Timeline',
            builder: (_) =>
                const Timeline(readOnly: true, groupBy: GroupAssetsBy.month, appBar: SliverAppBar(floating: true)),
          ),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          timelineServiceProvider.overrideWithValue(service),
          appConfigProvider.overrideWithValue(const AppConfig()),
          appSettingsServiceProvider.overrideWithValue(appSettings),
        ],
        child: MaterialApp.router(routerConfig: router.config()),
      ),
    );
    await tester.pump();
    await tester.pump();
    tester.takeException();

    await tester.drag(find.byType(CustomScrollView), const Offset(0, -300));
    await tester.pump();
    await tester.pump(kTimelineScrubberFadeInDuration);
    tester.takeException();

    final thumb = find.descendant(
      of: find.byType(Scrubber),
      matching: find.byWidgetPredicate((widget) => widget is GestureDetector && widget.onVerticalDragStart != null),
    );
    await tester.dragFrom(tester.getRect(thumb).centerRight - const Offset(10, 0), const Offset(0, 2000));
    await tester.pump();
    tester.takeException();

    final position = tester.state<ScrollableState>(find.byType(Scrollable).first).position;
    expect(position.pixels, position.maxScrollExtent);
    expect(tester.getRect(thumb).bottom, 840);
  });
}
