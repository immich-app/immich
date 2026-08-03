import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/archive.action.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../../service.mocks.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockAssetService assetService;

  setUp(() async {
    context = await PresentationContext.create();
    assetService = context.service.asset.service;
  });

  tearDown(() async {
    await context.dispose();
  });

  RemoteAsset owned({AssetVisibility visibility = .timeline}) =>
      RemoteAssetFactory.create(ownerId: context.currentUser.id, visibility: visibility);

  Future<void> pumpArchive(WidgetTester tester, Set<BaseAsset> selection) =>
      tester.pumpTestAction(context, const ArchiveAction(source: .timeline), overrides: context.selected(selection));

  group('ArchiveAction', () {
    testWidgets('archives the eligible owned assets', (tester) async {
      final asset = owned();

      await pumpArchive(tester, {asset});

      verify(() => assetService.update([asset.id], visibility: const Option.some(AssetVisibility.archive))).called(1);
    });

    testWidgets('unarchive the eligible owned assets', (tester) async {
      final asset = owned(visibility: .archive);

      await pumpArchive(tester, {asset});

      verify(() => assetService.update([asset.id], visibility: const .some(.timeline))).called(1);
    });

    testWidgets('prioritizes archive when mixed state', (tester) async {
      final onTimeline = owned();
      final archived = owned(visibility: .archive);

      await pumpArchive(tester, {onTimeline, archived});

      verify(() => assetService.update([onTimeline.id], visibility: const .some(.archive))).called(1);
      verifyNever(() => assetService.update(any(), visibility: const .some(.timeline)));
    });

    testWidgets('ignores assets owned by someone else', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create();

      await pumpArchive(tester, {mine, theirs});

      verify(() => assetService.update([mine.id], visibility: const .some(.archive))).called(1);
    });

    testWidgets('skips owned assets already in the target state', (tester) async {
      final stale = owned();
      final alreadyArchived = owned(visibility: .archive);

      await pumpArchive(tester, {stale, alreadyArchived});

      verify(() => assetService.update([stale.id], visibility: const .some(.archive))).called(1);
    });

    testWidgets('clears the selection once the update succeeds', (tester) async {
      await pumpArchive(tester, {owned()});
      await tester.pumpAndSettle();

      expect(find.byType(ImmichIconButton), findsNothing, reason: 'an empty selection hides the action');
    });

    testWidgets('is hidden for locked assets, which belong to neither direction', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(action: ArchiveAction(source: .timeline)),
        overrides: context.selected({owned(visibility: .locked)}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('is hidden inside the locked folder view', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(action: ArchiveAction(source: .timeline)),
        overrides: [
          ...context.selected({owned()}),
          inLockedViewProvider.overrideWithValue(true),
        ],
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('is hidden when none of the selected assets are owned', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(action: ArchiveAction(source: .timeline)),
        overrides: context.selected({RemoteAssetFactory.create()}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });
}
