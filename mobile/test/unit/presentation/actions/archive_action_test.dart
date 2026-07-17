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

  RemoteAsset owned({AssetVisibility visibility = .timeline}) =>
      RemoteAssetFactory.create(ownerId: context.currentUser.id, visibility: visibility);

  group('ArchiveAction', () {
    const action = ArchiveAction();

    testWidgets('archives the eligible owned assets', (tester) async {
      final asset = owned();
      final resolved = await tester.runAction(context, action, assets: [asset]);

      expect(resolved!.icon, Icons.archive_outlined);
      expect(resolved.label, StaticTranslations.instance.archive);
      verify(() => assetService.update([asset.id], visibility: const .some(.archive))).called(1);
    });

    testWidgets('batches every eligible owned asset into a single call', (tester) async {
      final first = owned();
      final second = owned();

      await tester.runAction(context, action, assets: [first, second]);

      verify(() => assetService.update([first.id, second.id], visibility: const .some(.archive))).called(1);
    });

    testWidgets('archives only the owned assets not already archived', (tester) async {
      final stale = owned();
      final alreadyArchived = owned(visibility: .archive);

      await tester.runAction(context, action, assets: [stale, alreadyArchived]);

      verify(() => assetService.update([stale.id], visibility: const .some(.archive))).called(1);
    });

    testWidgets('ignores assets owned by others', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create();

      await tester.runAction(context, action, assets: [mine, theirs]);

      verify(() => assetService.update([mine.id], visibility: const .some(.archive))).called(1);
    });

    testWidgets('reports the archived count through the toast repository', (tester) async {
      final toast = context.repository.toast;

      await tester.runAction(context, action, assets: [owned(), owned()]);

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.archive_action_prompt(count: 2));
    });
  });

  group('UnarchiveAction', () {
    const action = UnarchiveAction();

    testWidgets('unarchive the owned assets when every one is archived', (tester) async {
      final asset = owned(visibility: .archive);
      final resolved = await tester.runAction(context, action, assets: [asset]);

      expect(resolved!.icon, Icons.unarchive_outlined);
      expect(resolved.label, StaticTranslations.instance.unarchive);
      verify(() => assetService.update([asset.id], visibility: const .some(.timeline))).called(1);
    });

    testWidgets('ignores assets owned by others', (tester) async {
      final mine = owned(visibility: .archive);
      final theirs = RemoteAssetFactory.create(visibility: .archive);

      await tester.runAction(context, action, assets: [mine, theirs]);

      verify(() => assetService.update([mine.id], visibility: const .some(.timeline))).called(1);
    });

    testWidgets('reports the unarchive count through the toast repository', (tester) async {
      final toast = context.repository.toast;

      await tester.runAction(
        context,
        action,
        assets: [
          owned(visibility: .archive),
          owned(visibility: .archive),
        ],
      );

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.unarchive_action_prompt(count: 2));
    });
  });

  group('toggle visibility', () {
    testWidgets('a mixed selection shows Archive but not Unarchive', (tester) async {
      final assets = [owned(), owned(visibility: .archive)];

      final archive = await tester.resolveAction(context, const ArchiveAction(), assets: assets);
      final unarchive = await tester.resolveAction(context, const UnarchiveAction(), assets: assets);

      expect(archive, isNotNull);
      expect(unarchive, isNull);
    });

    testWidgets('an all-archived selection shows Unarchive but not Archive', (tester) async {
      final assets = [owned(visibility: .archive), owned(visibility: .archive)];

      final archive = await tester.resolveAction(context, const ArchiveAction(), assets: assets);
      final unarchive = await tester.resolveAction(context, const UnarchiveAction(), assets: assets);

      expect(archive, isNull);
      expect(unarchive, isNotNull);
    });
  });
}
