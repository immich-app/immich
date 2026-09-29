import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/restore.action.dart';
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

  RemoteAsset owned({bool trashed = true}) =>
      RemoteAssetFactory.create(ownerId: context.currentUser.id, deletedAt: trashed ? .new(2020) : null);

  Future<void> pumpRestore(WidgetTester tester, Set<BaseAsset> selection) =>
      tester.pumpTestAction(context, const RestoreAction(source: .timeline), overrides: context.selected(selection));

  group('RestoreAction', () {
    testWidgets('restores the eligible owned trashed assets', (tester) async {
      final asset = owned();

      await pumpRestore(tester, {asset});

      verify(() => assetService.restoreTrash([asset.id])).called(1);
    });

    testWidgets('ignores assets owned by someone else', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create(deletedAt: .new(2020));

      await pumpRestore(tester, {mine, theirs});

      verify(() => assetService.restoreTrash([mine.id])).called(1);
    });

    testWidgets('skips owned assets that are not trashed', (tester) async {
      final trashed = owned();
      final live = owned(trashed: false);

      await pumpRestore(tester, {trashed, live});

      verify(() => assetService.restoreTrash([trashed.id])).called(1);
    });

    testWidgets('clears the selection once the restore succeeds', (tester) async {
      await pumpRestore(tester, {owned()});
      await tester.pumpAndSettle();

      expect(find.byType(ImmichIconButton), findsNothing, reason: 'an empty selection hides the action');
    });

    testWidgets('offers an undo that puts the assets back in the trash', (tester) async {
      final asset = owned();

      await pumpRestore(tester, {asset});
      await tester.pumpAndSettle();
      await tester.tap(find.text('Undo'));
      await tester.pump();

      verify(() => assetService.trash([asset.id])).called(1);
    });

    testWidgets('is hidden when no owned asset is trashed', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(action: RestoreAction(source: .timeline)),
        overrides: context.selected({owned(trashed: false)}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });
}
