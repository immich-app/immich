import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/domain/services/tag.service.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/download.action.dart';
import 'package:immich_mobile/presentation/actions/tag.action.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_mobile/providers/infrastructure/user_metadata.provider.dart';
import 'package:immich_mobile/repositories/download.repository.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../../repository.mocks.dart';
import '../../factories/local_asset_factory.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockTagService tagService;

  setUp(() async {
    context = await PresentationContext.create();
    tagService = context.service.tag.service;
  });

  tearDown(() async {
    await context.dispose();
  });

  RemoteAsset owned() => RemoteAssetFactory.create(ownerId: context.currentUser.id);

  group('DownloadAction', () {
    Future<void> pumpDownload(WidgetTester tester, Set<BaseAsset> selection) => tester.pumpTestAction(
      context,
      const DownloadAction(source: .timeline),
      overrides: [
        ...context.selected(selection),
        downloadRepositoryProvider.overrideWithValue(context.repository.download.repo),
        backgroundSyncProvider.overrideWithValue(context.service.backgroundSync),
      ],
    );

    Future<void> settleDownload(WidgetTester tester) async {
      await tester.pump();
      await tester.pump(const .new(seconds: 1));
      await tester.pumpAndSettle();
    }

    testWidgets('downloads every selected remote asset', (tester) async {
      final asset = owned();

      await pumpDownload(tester, {asset});
      await settleDownload(tester);

      verify(() => context.repository.download.repo.downloadAllAssets([asset])).called(1);
    });

    testWidgets('ignores local-only assets, which are already on the device', (tester) async {
      final remote = owned();

      await pumpDownload(tester, {remote, LocalAssetFactory.create()});
      await settleDownload(tester);

      verify(() => context.repository.download.repo.downloadAllAssets([remote])).called(1);
    });

    testWidgets('is hidden when nothing remote is selected', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(action: DownloadAction(source: .timeline)),
        overrides: context.selected({LocalAssetFactory.create()}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });

  group('TagAction', () {
    late BuildContext actionContext;
    late WidgetRef actionRef;

    Future<void> pumpTag(WidgetTester tester, Set<BaseAsset> selection) => tester.pumpTestWidget(
      context,
      Consumer(
        builder: (widgetContext, ref, _) {
          actionContext = widgetContext;
          actionRef = ref;
          return const ActionIconButton(action: TagAction(source: .timeline));
        },
      ),
      overrides: [
        ...context.selected(selection),
        toastServiceProvider.overrideWithValue(context.service.toast),
        tagServiceProvider.overrideWithValue(tagService),
        userMetadataPreferencesProvider.overrideWith((ref) async => const .new(tagsEnabled: true)),
      ],
    );

    Future<void> applyTags(List<String> assetIds, {Set<String> selected = const {}, Set<String> created = const {}}) =>
        tagAssets(actionContext, actionRef, assetIds, selected: selected, created: created);

    testWidgets('offers tagging for an owned asset', (tester) async {
      await pumpTag(tester, {owned()});

      expect(find.byType(ImmichIconButton), findsOneWidget);
    });

    testWidgets('is hidden without any owned asset', (tester) async {
      await pumpTag(tester, {RemoteAssetFactory.create()});

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('applies the picked tags and reports the count', (tester) async {
      final asset = owned();
      when(() => tagService.bulkTagAssets(any(), any())).thenAnswer((_) async => 1);

      await pumpTag(tester, {asset});
      await applyTags([asset.id], selected: {'tag-1'});
      await tester.pumpAndSettle();

      verify(() => tagService.bulkTagAssets([asset.id], ['tag-1'])).called(1);

      final message = verify(() => context.service.toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.tagged_assets(count: 1));
    });

    testWidgets('creates new tags first and applies them alongside the picked ones', (tester) async {
      final asset = owned();
      when(() => tagService.upsertTags(any())).thenAnswer((_) async => [const Tag(id: 'made-1', value: 'brand new')]);
      when(() => tagService.bulkTagAssets(any(), any())).thenAnswer((_) async => 1);

      await pumpTag(tester, {asset});
      await applyTags([asset.id], selected: {'tag-1'}, created: {'brand new'});
      await tester.pumpAndSettle();

      verify(() => tagService.upsertTags(['brand new'])).called(1);
      final tagIds = verify(() => tagService.bulkTagAssets([asset.id], captureAny())).captured.single as List<String>;
      expect(tagIds, containsAll(['tag-1', 'made-1']));
    });

    testWidgets('does nothing when no tag was chosen or created', (tester) async {
      final asset = owned();

      await pumpTag(tester, {asset});
      await applyTags([asset.id]);
      await tester.pumpAndSettle();

      verifyNever(() => tagService.bulkTagAssets(any(), any()));
      verifyNever(() => context.service.toast.success(any()));
    });
  });
}
