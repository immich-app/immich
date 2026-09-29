import 'dart:async';
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
import 'package:immich_mobile/presentation/widgets/timeline/timeline.widget.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/routing/app_navigation_observer.dart';

import '../../../fixtures/asset.stub.dart';

void main() {
  testWidgets('status bar tap only scrolls the timeline when it is the visible page', (tester) async {
    tester.view.devicePixelRatio = 3.0;
    tester.view.physicalSize = const Size(1206, 2622);
    addTearDown(tester.view.reset);

    // Many assets for a tall viewport
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
            builder: (_) => const Timeline(
              withScrubber: false,
              readOnly: true,
              groupBy: GroupAssetsBy.none,
              appBar: SliverToBoxAdapter(child: SizedBox.shrink()),
            ),
          ),
        ),
        AutoRoute(
          path: '/overlay',
          page: PageInfo('Overlay', builder: (_) => const Scaffold(body: SizedBox.shrink())),
          type: RouteType.custom(
            customRouteBuilder: <T>(_, child, page) =>
                PageRouteBuilder<T>(settings: page, opaque: false, pageBuilder: (_, _, _) => child),
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
          routerConfig: router.config(navigatorObservers: () => [TransitioningRouteObserver()]),
        ),
      ),
    );
    // Segment stream resolves
    await tester.pump();
    // Asset buffer settles
    await tester.pump();
    // Thumbnails will fail to load
    tester.takeException();

    final position = tester
        .state<ScrollableState>(find.descendant(of: find.byType(Timeline), matching: find.byType(Scrollable)).first)
        .position;

    // Closure mimicking the framework making a status bar tap call
    Future<void> tapStatusBar() => tester.binding.defaultBinaryMessenger.handlePlatformMessage(
      SystemChannels.statusBar.name,
      SystemChannels.statusBar.codec.encodeMethodCall(const MethodCall('handleScrollToTop')),
      null,
    );

    // Scroll down
    await tester.drag(find.byType(Timeline), const Offset(0, -1500));
    await tester.pumpAndSettle();
    final initialScrolledPosition = position.pixels;
    expect(initialScrolledPosition, greaterThan(200));

    // Push a subroute. Taps on this status bar should be ignored
    unawaited(router.pushPath('/overlay'));
    await tester.pumpAndSettle();
    await tapStatusBar();
    await tester.pumpAndSettle();
    expect(position.pixels, initialScrolledPosition, reason: 'ignored while behind a pushed route');

    // The tap is async, so it can arrive while a pushed route is transitioning to popped
    unawaited(router.maybePop());
    await tester.pump();
    await tapStatusBar();
    await tester.pumpAndSettle();
    expect(position.pixels, initialScrolledPosition, reason: 'ignored while the pushed route pops');

    // Once the timeline is visible, taps on the status bar should scroll to the top
    await tapStatusBar();
    await tester.pumpAndSettle();
    expect(position.pixels, 0, reason: 'scrolls the foreground timeline');
  });
}
