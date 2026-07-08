import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/delete.action.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/widgets/common/confirm_dialog.dart';
import 'package:mocktail/mocktail.dart';

import '../../../domain/service.mock.dart';
import '../../factories/local_asset_factory.dart';
import '../../factories/remote_asset_factory.dart';
import '../../riverpod_mocks.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockAssetService assetService;
  late MockCleanupService cleanupService;

  setUp(() async {
    context = await PresentationContext.create();
    assetService = context.service.asset.service;
    cleanupService = context.service.cleanup.service;
  });

  tearDown(() async {
    debugDefaultTargetPlatformOverride = null;
    await StoreService.I.put(StoreKey.manageLocalMediaAndroid, false);
    context.dispose();
  });

  RemoteAsset owned({AssetVisibility visibility = .timeline, DateTime? deletedAt, String? localId}) =>
      RemoteAssetFactory.create(
        ownerId: context.currentUser.id,
        visibility: visibility,
        deletedAt: deletedAt,
        localId: localId,
      );

  List<Override> disableTrash() => [
    serverInfoProvider.overrideWith((ref) => FakeServerInfoNotifier(trashEnabled: false)),
  ];

  Future<void> respondToDialog(WidgetTester tester, {required bool confirm}) async {
    await tester.pump(const Duration(milliseconds: 300));
    expect(find.byType(ConfirmDialog), findsOneWidget);
    await tester.tap(find.byType(TextButton).at(confirm ? 1 : 0)); // [cancel, ok]
    await tester.pumpAndSettle();
  }

  group('DeleteAction', () {
    group('trash', () {
      testWidgets('trashes a remote-only owned asset', (tester) async {
        final asset = owned();

        await tester.pumpTestAction(context, (scope) => DeleteAction(assets: [asset], scope: scope));
        await tester.pumpAndSettle();

        verify(() => assetService.trash([asset.id])).called(1);
        verifyNever(() => assetService.delete(any()));
        verifyNever(() => cleanupService.deleteLocalAssets(any()));
      });

      testWidgets('ignores assets owned by someone else', (tester) async {
        final mine = owned();
        final theirs = RemoteAssetFactory.create();

        await tester.pumpTestAction(context, (scope) => DeleteAction(assets: [mine, theirs], scope: scope));
        await tester.pumpAndSettle();

        verify(() => assetService.trash([mine.id])).called(1);
      });

      testWidgets('trashes a merged asset and removes its device copy', (tester) async {
        final asset = owned(localId: 'local');

        await tester.pumpTestAction(context, (scope) => DeleteAction(assets: [asset], scope: scope));
        await tester.pumpAndSettle();

        verify(() => cleanupService.deleteLocalAssets(['local'])).called(1);
        verify(() => assetService.trash([asset.id])).called(1);
      });
    });

    group('permanent', () {
      testWidgets('permanently deletes when the trash feature is disabled', (tester) async {
        final asset = owned();

        await tester.pumpTestAction(
          context,
          (scope) => DeleteAction(assets: [asset], scope: scope),
          overrides: disableTrash(),
        );
        await respondToDialog(tester, confirm: true);

        verify(() => assetService.delete([asset.id])).called(1);
        verifyNever(() => assetService.trash(any()));
      });

      testWidgets('permanently deletes a merged asset and removes its device copy', (tester) async {
        final asset = owned(localId: 'local');

        await tester.pumpTestAction(
          context,
          (scope) => DeleteAction(assets: [asset], scope: scope),
          overrides: disableTrash(),
        );
        await respondToDialog(tester, confirm: true);

        verify(() => assetService.delete([asset.id])).called(1);
        verify(() => cleanupService.deleteLocalAssets(['local'])).called(1);
      });

      testWidgets('permanently deletes already trashed assets even with trash enabled', (tester) async {
        final asset = owned(deletedAt: DateTime(2024));

        await tester.pumpTestAction(context, (scope) => DeleteAction(assets: [asset], scope: scope));
        await respondToDialog(tester, confirm: true);

        verify(() => assetService.delete([asset.id])).called(1);
        verifyNever(() => assetService.trash(any()));
      });

      testWidgets('permanently deletes locked folder assets even with trash enabled', (tester) async {
        final asset = owned(visibility: .locked, localId: 'local');

        await tester.pumpTestAction(context, (scope) => DeleteAction(assets: [asset], scope: scope));
        await respondToDialog(tester, confirm: true);

        verify(() => assetService.delete([asset.id])).called(1);
        verify(() => cleanupService.deleteLocalAssets(['local'])).called(1);
      });

      testWidgets('does nothing when the confirmation is cancelled', (tester) async {
        final asset = owned(visibility: .locked, localId: 'local');

        await tester.pumpTestAction(context, (scope) => DeleteAction(assets: [asset], scope: scope));
        await respondToDialog(tester, confirm: false);

        verifyNever(() => assetService.delete(any()));
        verifyNever(() => cleanupService.deleteLocalAssets(any()));
      });
    });

    group('local only', () {
      testWidgets('removes the device copy with no remote call', (tester) async {
        final asset = LocalAssetFactory.create();

        await tester.pumpTestAction(context, (scope) => DeleteAction(assets: [asset], scope: scope));
        await tester.pumpAndSettle();

        verify(() => cleanupService.deleteLocalAssets([asset.id])).called(1);
        verifyNever(() => assetService.trash(any()));
        verifyNever(() => assetService.delete(any()));
      });
    });

    group('prompt handling', () {
      testWidgets('permanent delete shows a single app dialog', (tester) async {
        final asset = owned(localId: 'local');

        await tester.pumpTestAction(
          context,
          (scope) => DeleteAction(assets: [asset], scope: scope),
          overrides: disableTrash(),
        );
        await tester.pump(const Duration(milliseconds: 300));

        expect(find.text(StaticTranslations.instance.delete_dialog_title), findsOneWidget);
        await tester.tap(find.byType(TextButton).at(1));
        await tester.pumpAndSettle();

        expect(find.text(StaticTranslations.instance.move_to_device_trash), findsNothing);
        verify(() => assetService.delete([asset.id])).called(1);
        verify(() => cleanupService.deleteLocalAssets(['local'])).called(1);
      });

      testWidgets('local only delete on Android with MANAGE_MEDIA shows the prompt', (tester) async {
        debugDefaultTargetPlatformOverride = TargetPlatform.android;
        await StoreService.I.put(StoreKey.manageLocalMediaAndroid, true);
        final asset = LocalAssetFactory.create();

        await tester.pumpTestAction(context, (scope) => DeleteAction(assets: [asset], scope: scope));
        await tester.pump(const Duration(milliseconds: 300));

        expect(find.text(StaticTranslations.instance.move_to_device_trash), findsOneWidget);
        await tester.tap(find.byType(TextButton).at(1)); // confirm
        await tester.pumpAndSettle();

        verify(() => cleanupService.deleteLocalAssets([asset.id])).called(1);
        debugDefaultTargetPlatformOverride = null;
      });
    });
  });

  group('CleanupLocalAction', () {
    testWidgets('deletes only backed up device copies', (tester) async {
      final backedUp = LocalAssetFactory.create(remoteId: 'remote');
      final localOnly = LocalAssetFactory.create();

      await tester.pumpTestAction(context, (scope) => CleanupLocalAction(assets: [backedUp, localOnly], scope: scope));
      await tester.pumpAndSettle();

      verify(() => cleanupService.deleteLocalAssets([backedUp.id])).called(1);
    });

    testWidgets('is hidden when no backed up assets are selected', (tester) async {
      final action = await tester.pumpActionButton(
        context,
        (scope) => CleanupLocalAction(assets: [LocalAssetFactory.create()], scope: scope),
      );

      expect(action.isVisible, isFalse);
    });
  });
}
