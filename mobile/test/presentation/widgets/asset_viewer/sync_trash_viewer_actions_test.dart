import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/delete_action_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/asset_viewer.page.dart';
import 'package:immich_mobile/presentation/widgets/asset_viewer/bottom_bar.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/services/gcast.service.dart';
import 'package:mocktail/mocktail.dart';

import '../../../unit/factories/remote_asset_factory.dart';
import '../../../unit/presentation/presentation_context.dart';

class MockGCastService extends Mock implements GCastService {}

class _AssetViewerHarness extends ConsumerStatefulWidget {
  final BaseAsset asset;

  const _AssetViewerHarness({required this.asset});

  @override
  ConsumerState<_AssetViewerHarness> createState() => _AssetViewerHarnessState();
}

class _AssetViewerHarnessState extends ConsumerState<_AssetViewerHarness> {
  @override
  void initState() {
    super.initState();
    Future<void>(() {
      if (mounted) {
        ref.read(assetViewerProvider.notifier).setAsset(widget.asset);
      }
    });
  }

  @override
  Widget build(BuildContext context) => const ViewerBottomBar();
}

class _SeededAssetViewerNotifier extends AssetViewerStateNotifier {
  final BaseAsset asset;

  _SeededAssetViewerNotifier(this.asset);

  @override
  AssetViewerState build() {
    super.build();
    return AssetViewerState(currentAsset: asset);
  }
}

class _MutableSyncTrashTimelineService extends TimelineService {
  List<BaseAsset> assets;

  _MutableSyncTrashTimelineService(this.assets)
    : super((
        assetSource: (index, count) async => assets.skip(index).take(count).toList(),
        bucketSource: () => Stream.value([Bucket(assetCount: assets.length)]),
        origin: TimelineOrigin.syncTrash,
      ));

  @override
  int get totalAssets => assets.length;

  @override
  Future<BaseAsset?> getAssetAsync(int index) async => getAssetSafe(index);

  @override
  BaseAsset? getAssetSafe(int index) => index >= 0 && index < assets.length ? assets[index] : null;

  @override
  int? getIndex(String heroTag) {
    final index = assets.indexWhere((asset) => asset.heroTag == heroTag);
    return index >= 0 ? index : null;
  }

  @override
  Future<void> preloadAssets(int index) async {}
}

extension _PumpAssetViewer on WidgetTester {
  Future<void> pumpAssetViewer(
    PresentationContext context, {
    required TimelineService timeline,
    required BaseAsset initialAsset,
  }) async {
    await pumpWidget(
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
            gCastServiceProvider.overrideWithValue(MockGCastService()),
            timelineServiceProvider.overrideWithValue(timeline),
            assetViewerProvider.overrideWith(() => _SeededAssetViewerNotifier(initialAsset)),
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
    await pump();
    await pump(const Duration(milliseconds: 600));
    takeException();
  }

  Future<void> pumpAssetViewerRouteHarness(
    PresentationContext context, {
    required _MutableSyncTrashTimelineService timeline,
    required BaseAsset initialAsset,
  }) async {
    await pumpWidget(
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
            gCastServiceProvider.overrideWithValue(MockGCastService()),
            timelineServiceProvider.overrideWithValue(timeline),
            assetViewerProvider.overrideWith(() => _SeededAssetViewerNotifier(initialAsset)),
          ],
          child: Builder(
            builder: (context) => MaterialApp(
              debugShowCheckedModeBanner: false,
              localizationsDelegates: context.localizationDelegates,
              supportedLocales: context.supportedLocales,
              locale: context.locale,
              home: Builder(
                builder: (context) => Scaffold(
                  body: Column(
                    children: [
                      const Text('route-home'),
                      ElevatedButton(
                        onPressed: () => Navigator.of(context).push(
                          MaterialPageRoute<void>(builder: (_) => const Material(child: AssetViewer(initialIndex: 0))),
                        ),
                        child: const Text('open-viewer'),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
    await pump();
  }
}

void main() {
  late PresentationContext context;

  setUp(() async {
    context = await PresentationContext.create();
  });

  tearDown(() {
    context.dispose();
  });

  TimelineService syncTrashTimeline(BaseAsset asset) => TimelineService((
    assetSource: (_, _) async => [asset],
    bucketSource: () => Stream.value(const [Bucket(assetCount: 1)]),
    origin: TimelineOrigin.syncTrash,
  ));

  testWidgets('sync trash viewer bottom bar shows only review decisions', (tester) async {
    final asset = RemoteAssetFactory.create(ownerId: context.currentUser.id);
    when(() => context.service.asset.service.watchAsset(asset)).thenAnswer((_) => Stream.value(asset));
    final timeline = syncTrashTimeline(asset);
    addTearDown(timeline.dispose);

    await tester.pumpTestWidget(
      context,
      _AssetViewerHarness(asset: asset),
      overrides: [timelineServiceProvider.overrideWithValue(timeline)],
    );

    expect(find.text('Keep'), findsOneWidget);
    expect(find.text('Delete'), findsOneWidget);
    expect(find.text('Share'), findsNothing);
    expect(find.byType(DeleteActionButton), findsNothing);
  });

  testWidgets('sync trash viewer advances after a review decision event', (tester) async {
    final first = RemoteAssetFactory.create(ownerId: context.currentUser.id, id: 'first');
    final second = RemoteAssetFactory.create(ownerId: context.currentUser.id, id: 'second');
    when(() => context.service.asset.service.watchAsset(first)).thenAnswer((_) => Stream.value(first));
    when(() => context.service.asset.service.watchAsset(second)).thenAnswer((_) => Stream.value(second));
    final timeline = _MutableSyncTrashTimelineService([first, second]);
    addTearDown(timeline.dispose);

    await tester.pumpAssetViewer(context, timeline: timeline, initialAsset: first);

    EventStream.shared.emit(const ViewerReloadAssetEvent());
    await tester.pump();
    await tester.pump(Durations.medium1);
    tester.takeException();

    expect(find.text(first.name), findsNothing);
    expect(find.text(second.name), findsOneWidget);
  });

  testWidgets('sync trash viewer pops when review timeline becomes empty', (tester) async {
    final asset = RemoteAssetFactory.create(ownerId: context.currentUser.id);
    when(() => context.service.asset.service.watchAsset(asset)).thenAnswer((_) => Stream.value(asset));
    final timeline = _MutableSyncTrashTimelineService([asset]);
    addTearDown(timeline.dispose);

    await tester.pumpAssetViewerRouteHarness(context, timeline: timeline, initialAsset: asset);
    await tester.tap(find.text('open-viewer'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));
    tester.takeException();

    expect(find.byType(AssetViewer), findsOneWidget);

    timeline.assets = [];
    EventStream.shared.emit(const TimelineReloadEvent());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 600));
    tester.takeException();

    expect(find.byType(AssetViewer), findsNothing);
    expect(find.text('route-home'), findsOneWidget);
  });
}
