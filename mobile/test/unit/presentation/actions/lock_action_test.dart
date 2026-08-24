import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/lock.action.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
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

  Future<void> pumpLock(WidgetTester tester, Set<BaseAsset> selection) =>
      tester.pumpTestAction(context, const LockAction(source: .timeline), overrides: context.selected(selection));

  Future<void> respondToDialog(WidgetTester tester, {required bool confirm}) async {
    await tester.pumpUntilFound(find.byType(ConfirmDialog));
    expect(find.text(StaticTranslations.instance.move_to_locked_folder), findsOneWidget);
    await tester.tap(find.text(confirm ? StaticTranslations.instance.confirm : StaticTranslations.instance.cancel));
    await tester.pumpAndSettle();
  }

  group('LockAction', () {
    testWidgets('locks the eligible owned assets', (tester) async {
      final asset = owned();

      await pumpLock(tester, {asset});

      verify(() => assetService.update([asset.id], visibility: const .some(.locked))).called(1);
    });

    testWidgets('unlocks the eligible owned assets', (tester) async {
      final asset = owned(visibility: .locked);

      await pumpLock(tester, {asset});

      verify(() => assetService.update([asset.id], visibility: const .some(.timeline))).called(1);
    });

    testWidgets('prioritizes lock when mixed state', (tester) async {
      final unlocked = owned();
      final locked = owned(visibility: .locked);

      await pumpLock(tester, {unlocked, locked});

      verify(() => assetService.update([unlocked.id], visibility: const .some(.locked))).called(1);
      verifyNever(() => assetService.update(any(), visibility: const .some(.timeline)));
    });

    testWidgets('ignores assets owned by someone else', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create();

      await pumpLock(tester, {mine, theirs});

      verify(() => assetService.update([mine.id], visibility: const .some(.locked))).called(1);
    });

    testWidgets('locks only the owned assets not already locked', (tester) async {
      final stale = owned();
      final alreadyLocked = owned(visibility: .locked);

      await pumpLock(tester, {stale, alreadyLocked});

      verify(() => assetService.update([stale.id], visibility: const .some(.locked))).called(1);
    });

    testWidgets('removes the local copies of the assets it locks', (tester) async {
      final merged = RemoteAssetFactory.create(ownerId: context.currentUser.id, localId: 'local-1');
      final remoteOnly = owned();

      await pumpLock(tester, {merged, remoteOnly});
      await respondToDialog(tester, confirm: true);

      verify(() => assetService.deleteLocal(['local-1'], trash: false)).called(1);
    });

    testWidgets('does nothing when the warning is cancelled', (tester) async {
      final merged = RemoteAssetFactory.create(ownerId: context.currentUser.id, localId: 'local-1');

      await pumpLock(tester, {merged});
      await respondToDialog(tester, confirm: false);

      verifyNever(() => assetService.update(any(), visibility: any(named: 'visibility')));
      verifyNever(() => assetService.deleteLocal(any(), trash: any(named: 'trash')));
    });

    testWidgets('locks remote-only assets without a warning', (tester) async {
      final remoteOnly = owned();

      await pumpLock(tester, {remoteOnly});

      expect(find.byType(ConfirmDialog), findsNothing);
      verify(() => assetService.update([remoteOnly.id], visibility: const .some(.locked))).called(1);
    });

    testWidgets('leaves the local copies alone when unlocking', (tester) async {
      final merged = RemoteAssetFactory.create(
        ownerId: context.currentUser.id,
        localId: 'local-1',
        visibility: .locked,
      );

      await pumpLock(tester, {merged});

      verifyNever(() => assetService.deleteLocal(any()));
    });

    testWidgets('offers an undo that locks the unlocked assets again', (tester) async {
      final asset = owned(visibility: .locked);

      await pumpLock(tester, {asset});
      await tester.pumpAndSettle();
      await tester.tap(find.text('Undo'));
      await tester.pump();

      verify(() => assetService.update([asset.id], visibility: const .some(.locked))).called(1);
    });

    testWidgets('offers no undo for locking', (tester) async {
      await pumpLock(tester, {owned()});
      await tester.pumpAndSettle();

      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text('Undo'), findsNothing);
    });

    testWidgets('clears the selection once the update succeeds', (tester) async {
      await pumpLock(tester, {owned()});
      await tester.pumpAndSettle();

      expect(find.byType(ImmichIconButton), findsNothing, reason: 'an empty selection hides the action');
    });

    testWidgets('is hidden when none of the selected assets are owned', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(action: LockAction(source: .timeline)),
        overrides: context.selected({RemoteAssetFactory.create()}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });
}
