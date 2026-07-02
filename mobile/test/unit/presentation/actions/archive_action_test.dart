import 'package:flutter/material.dart';
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
      final view = await tester.pumpTestAction(context, ArchiveAction(assets: [asset]));

      expect(view, isA<ArchiveView>());
      expect(view.icon, Icons.archive_outlined);
      expect(view.label, StaticTranslations.instance.archive);

      await view.onAction();
      verify(() => assetService.updateVisibility([asset.id], .archive)).called(1);
    });

    testWidgets('unarchive the eligible owned assets', (tester) async {
      final asset = owned(visibility: .archive);
      final view = await tester.pumpTestAction(context, ArchiveAction(assets: [asset]));

      expect(view, isA<UnarchiveView>());
      expect(view.icon, Icons.unarchive_outlined);
      expect(view.label, StaticTranslations.instance.unarchive);

      await view.onAction();
      verify(() => assetService.updateVisibility([asset.id], .timeline)).called(1);
    });

    testWidgets('dispatches on owned state, ignoring assets owned by others', (tester) async {
      final mine = owned(visibility: .archive);
      final theirs = RemoteAssetFactory.create();
      final view = await tester.pumpTestAction(context, ArchiveAction(assets: [mine, theirs]));
      expect(view, isA<UnarchiveView>());

      await view.onAction();
      verify(() => assetService.updateVisibility([mine.id], .timeline)).called(1);
    });

    testWidgets('batches every eligible owned asset into a single call', (tester) async {
      final first = owned();
      final second = owned();

      await tester.pumpTestAction(context, ArchiveAction(assets: [first, second]));

      verify(() => assetService.updateVisibility([first.id, second.id], .archive)).called(1);
    });

    testWidgets('archives only the owned assets not already archived', (tester) async {
      final stale = owned();
      final alreadyArchived = owned(visibility: .archive);

      await tester.pumpTestAction(context, ArchiveAction(assets: [stale, alreadyArchived]));

      verify(() => assetService.updateVisibility([stale.id], .archive)).called(1);
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
            owned(visibility: .archive),
            owned(visibility: .archive),
          ],
        ),
      );

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.unarchive_action_prompt(count: 2));
    });
  });
}
