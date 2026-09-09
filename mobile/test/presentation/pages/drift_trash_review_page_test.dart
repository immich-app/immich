import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/generated/codegen_loader.g.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/trash_review.action.dart';
import 'package:immich_mobile/presentation/pages/drift_trash_review.page.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/trash_sync_bottom_bar.widget.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/infrastructure/trash_sync.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../service.mocks.dart';
import '../../unit/factories/user_factory.dart';

class MockTimelineFactory extends Mock implements TimelineFactory {}

class _TestReadOnlyModeNotifier extends ReadOnlyModeNotifier {
  @override
  bool build() => false;
}

final _reviewAsset = LocalAsset(
  id: 'asset-1',
  name: 'review.jpg',
  checksum: 'checksum-1',
  type: AssetType.image,
  createdAt: DateTime(2026),
  updatedAt: DateTime(2026),
  playbackStyle: AssetPlaybackStyle.image,
  isEdited: false,
);

TimelineService _timeline(List<BaseAsset> assets, {TimelineAssetSource? assetSource}) => TimelineService((
  assetSource: assetSource ?? (index, count) async => assets.skip(index).take(count).toList(),
  bucketSource: () => Stream.value([Bucket(assetCount: assets.length)]),
  origin: TimelineOrigin.syncTrash,
));

void main() {
  late MockTimelineFactory timelineFactory;
  late MockUserService userService;

  setUp(() {
    timelineFactory = MockTimelineFactory();
    userService = MockUserService();
    when(() => userService.tryGetMyUser()).thenReturn(UserFactory.createDto(id: 'user-1'));
    when(() => userService.watchMyUser()).thenAnswer((_) => const Stream.empty());
  });

  Future<void> pumpReviewPage(WidgetTester tester, List<BaseAsset> assets) async {
    final timeline = _timeline(assets);
    when(() => timelineFactory.syncTrash()).thenReturn(timeline);
    addTearDown(timeline.dispose);

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
            appConfigProvider.overrideWithValue(const AppConfig()),
            timelineFactoryProvider.overrideWithValue(timelineFactory),
            pendingTrashReviewCountProvider.overrideWith((ref) => Stream.value(assets.length)),
            currentUserProvider.overrideWith((ref) => CurrentUserProvider(userService)),
            readonlyModeProvider.overrideWith(_TestReadOnlyModeNotifier.new),
          ],
          child: Builder(
            builder: (context) => MaterialApp(
              localizationsDelegates: context.localizationDelegates,
              supportedLocales: context.supportedLocales,
              locale: context.locale,
              home: const DriftTrashReviewPage(),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> pumpActionBar(WidgetTester tester, List<BaseAsset> assets) async {
    final timeline = _timeline(assets);
    addTearDown(timeline.dispose);

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
            timelineServiceProvider.overrideWithValue(timeline),
            multiSelectProvider.overrideWith(
              () => MultiSelectNotifier(MultiSelectState(selectedAssets: assets.toSet(), lockedSelectionAssets: {})),
            ),
          ],
          child: Builder(
            builder: (context) => MaterialApp(
              localizationsDelegates: context.localizationDelegates,
              supportedLocales: context.supportedLocales,
              locale: context.locale,
              home: const Scaffold(body: TrashSyncBottomBar()),
            ),
          ),
        ),
      ),
    );
  }

  testWidgets('review page uses sync trash timeline and shows empty state', (tester) async {
    await pumpReviewPage(tester, const []);
    await tester.pumpAndSettle();

    expect(find.text('Nothing left to review — all decisions applied.'), findsOneWidget);
    verify(() => timelineFactory.syncTrash()).called(1);
  });

  testWidgets('bottom bar shows keep and move-to-trash review action buttons', (tester) async {
    await pumpActionBar(tester, [_reviewAsset]);
    await tester.pumpAndSettle();

    final actions = tester.widgetList<ActionButton>(find.byType(ActionButton)).map((button) => button.action);
    expect(actions.whereType<KeepOnDeviceAction>(), hasLength(1));
    expect(actions.whereType<MoveToTrashAction>(), hasLength(1));
  });
}
