import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/archive.action.dart';
import 'package:mocktail/mocktail.dart';

import '../../../domain/service.mock.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockAssetService assetService;

  setUp(() async {
    context = await PresentationContext.create();
    assetService = context.service.asset.service;
  });

  tearDown(() {
    context.dispose();
  });

  RemoteAsset owned({AssetVisibility visibility = AssetVisibility.timeline}) =>
      RemoteAssetFactory.create(ownerId: context.currentUser.id, visibility: visibility);

  group('ArchiveAction', () {
    testWidgets('archives the eligible owned assets', (tester) async {
      final asset = owned();

      await tester.pumpTestAction(context, ArchiveAction(assets: [asset]));

      verify(() => assetService.updateVisibility([asset.id], AssetVisibility.archive)).called(1);
    });

    testWidgets('unarchive the eligible owned assets', (tester) async {
      final asset = owned(visibility: AssetVisibility.archive);

      await tester.pumpTestAction(context, ArchiveAction(assets: [asset]));

      verify(() => assetService.updateVisibility([asset.id], AssetVisibility.timeline)).called(1);
    });

    testWidgets('ignores assets owned by someone else', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create();

      await tester.pumpTestAction(context, ArchiveAction(assets: [mine, theirs]));

      verify(() => assetService.updateVisibility([mine.id], AssetVisibility.archive)).called(1);
    });

    testWidgets('batches every eligible owned asset into a single call', (tester) async {
      final first = owned();
      final second = owned();

      await tester.pumpTestAction(context, ArchiveAction(assets: [first, second]));

      verify(() => assetService.updateVisibility([first.id, second.id], AssetVisibility.archive)).called(1);
    });

    testWidgets('skips owned assets already in the target state', (tester) async {
      final stale = owned();
      final alreadyArchived = owned(visibility: AssetVisibility.archive);

      await tester.pumpTestAction(context, ArchiveAction(assets: [stale, alreadyArchived]));

      verify(() => assetService.updateVisibility([stale.id], AssetVisibility.archive)).called(1);
    });

    testWidgets('reports the archived count through the toast repository', (tester) async {
      final toast = context.repository.toast;

      await tester.pumpTestAction(context, ArchiveAction(assets: [owned(), owned()]));

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.archive_action_prompt(count: 2));
    });

    testWidgets('reports the unarchive count through the toast repository', (tester) async {
      final toast = context.repository.toast;

      await tester.pumpTestAction(
        context,
        ArchiveAction(
          assets: [
            owned(visibility: AssetVisibility.archive),
            owned(visibility: AssetVisibility.archive),
          ],
        ),
      );

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.unarchive_action_prompt(count: 2));
    });
  });
}
