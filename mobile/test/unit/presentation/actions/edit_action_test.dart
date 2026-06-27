import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/edit.action.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../../domain/service.mock.dart';
import '../../../infrastructure/repository.mock.dart';
import '../../factories/remote_asset_factory.dart';
import '../../riverpod_mocks.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockRemoteAssetRepository remoteAssetRepo;
  late MockAssetService assetService;

  const supportedVersion = ServerVersion(major: 2, minor: 6, patch: 0);
  const unsupportedVersion = ServerVersion(major: 2, minor: 5, patch: 9);

  setUp(() async {
    context = await PresentationContext.create();
    remoteAssetRepo = context.repository.remoteAsset.repo;
    assetService = context.service.asset.service;
  });

  tearDown(() {
    context.dispose();
  });

  List<Override> overrides(ServerVersion version) => [
    serverInfoProvider.overrideWith((ref) => FakeServerInfoNotifier(version)),
  ];

  RemoteAsset owned({AssetType type = AssetType.image}) =>
      RemoteAssetFactory.create(ownerId: context.currentUser.id, type: type);

  Future<void> pumpAction(WidgetTester tester, EditAssetAction action, {ServerVersion version = supportedVersion}) =>
      tester.pumpTestWidget(context, ActionIconButtonWidget(action: action), overrides: overrides(version));

  group('EditAssetAction', () {
    testWidgets('visible for a single owned editable asset on a supported server', (tester) async {
      await pumpAction(tester, EditAssetAction(assets: [owned()]));

      expect(find.byType(ImmichIconButton), findsOneWidget);
    });

    testWidgets('hidden when the server is older than 2.6.0', (tester) async {
      await pumpAction(tester, EditAssetAction(assets: [owned()]), version: unsupportedVersion);

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('hidden for more than one asset', (tester) async {
      await pumpAction(tester, EditAssetAction(assets: [owned(), owned()]));

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('hidden for an asset owned by someone else', (tester) async {
      await pumpAction(tester, EditAssetAction(assets: [RemoteAssetFactory.create()]));

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('hidden for a non-editable asset', (tester) async {
      await pumpAction(tester, EditAssetAction(assets: [owned(type: AssetType.video)]));

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });

  group('EditAssetAction onAction', () {
    testWidgets('reads the edits and exif for the asset from the repository', (tester) async {
      final asset = owned();
      await tester.pumpTestAction(context, EditAssetAction(assets: [asset]), overrides: overrides(supportedVersion));
      await tester.pumpAndSettle();

      verify(() => remoteAssetRepo.getAssetEdits(asset.id)).called(1);
      verify(() => remoteAssetRepo.getExif(asset.id)).called(1);
    });

    testWidgets('applyEdits forwards the edits to the service and waits for both ready events', (tester) async {
      late FakeWebsocketNotifier websocket;
      const edits = <AssetEdit>[];

      late WidgetRef capturedRef;
      await tester.pumpTestWidget(
        context,
        Consumer(
          builder: (_, ref, _) {
            capturedRef = ref;
            return const SizedBox.shrink();
          },
        ),
        overrides: [websocketProvider.overrideWith((ref) => websocket = FakeWebsocketNotifier(ref))],
      );

      await applyEdits(capturedRef, 'asset-1', edits);

      verify(() => assetService.applyEdits('asset-1', edits)).called(1);
      expect(websocket.waitedEvents, containsAll(['AssetEditReadyV1', 'AssetEditReadyV2']));
    });
  });
}
