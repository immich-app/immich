import 'dart:math' as math;

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/presentation/widgets/images/thumbnail_tile.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

import '../../../fixtures/asset.stub.dart';

void main() {
  testWidgets('should not reload row data when toggling recommendDeferredLoading', (tester) async {
    final assets = List<BaseAsset>.generate(2000, (i) => LocalAssetStub.image1.copyWith(id: 'a$i'));
    final service = TimelineService((
      assetSource: (i, n) async => assets.sublist(i, math.min(i + n, assets.length)),
      bucketSource: () => Stream.value([TimeBucket(date: DateTime(2025), assetCount: assets.length)]),
      origin: TimelineOrigin.main,
    ));
    addTearDown(service.dispose);

    final container = ProviderContainer(
      overrides: [
        timelineServiceProvider.overrideWithValue(service),
        appConfigProvider.overrideWithValue(const AppConfig()),
      ],
    );
    addTearDown(container.dispose);

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
              appBar: SliverToBoxAdapter(child: SizedBox.shrink()),
            ),
          ),
        ),
      ],
    );

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp.router(routerConfig: router.config()),
      ),
    );

    // Segment stream resolves, then the first buffer
    await tester.pump();
    await tester.pump();

    // Start past the first buffer
    tester
        .state<ScrollableState>(find.descendant(of: find.byType(Timeline), matching: find.byType(Scrollable)).first)
        .position
        .jumpTo(90000);

    await tester.pump(const Duration(milliseconds: 200));
    await tester.pump();

    // Thumbnails will fail to load
    tester.takeException();

    final drawn = find.byType(ThumbnailTile).evaluate().length;
    expect(drawn, greaterThan(0));

    container.read(timelineStateProvider.notifier).setRecommendDeferredLoading(true);
    await tester.pump();

    expect(find.byType(ThumbnailTile), findsNWidgets(drawn));
  });
}
