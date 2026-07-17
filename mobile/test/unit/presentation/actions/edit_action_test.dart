import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/presentation/actions/edit_asset.action.dart';
import 'package:immich_mobile/presentation/actions/edit_datetime.action.dart';
import 'package:immich_mobile/presentation/actions/edit_location.action.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:mocktail/mocktail.dart';

import '../../../domain/service.mock.dart';
import '../../factories/remote_asset_factory.dart';
import '../../riverpod_mocks.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockAssetService assetService;

  const unsupportedVersion = ServerVersion(major: 2, minor: 5, patch: 9);

  setUp(() async {
    context = await PresentationContext.create();
    assetService = context.service.asset.service;
  });

  tearDown(() {
    context.dispose();
  });

  List<Override> serverVersion(ServerVersion version) => [
    serverInfoProvider.overrideWith((ref) => FakeServerInfoNotifier(version: version)),
  ];

  RemoteAsset owned({AssetType type = .image}) =>
      RemoteAssetFactory.create(ownerId: context.currentUser.id, type: type);

  group('EditAssetAction', () {
    const action = EditAssetAction();

    testWidgets('visible for a single owned editable asset on a supported server', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [owned()]);

      expect(resolved, isNotNull);
      expect(resolved!.icon, Icons.tune);
      expect(resolved.label, StaticTranslations.instance.edit);
    });

    testWidgets('hidden when the server is older than 2.6.0', (tester) async {
      final resolved = await tester.resolveAction(
        context,
        action,
        assets: [owned()],
        overrides: serverVersion(unsupportedVersion),
      );

      expect(resolved, isNull);
    });

    testWidgets('hidden for more than one asset', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [owned(), owned()]);

      expect(resolved, isNull);
    });

    testWidgets('hidden for an asset owned by someone else', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [RemoteAssetFactory.create()]);

      expect(resolved, isNull);
    });

    testWidgets('hidden for a non-editable asset', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [owned(type: .video)]);

      expect(resolved, isNull);
    });

    testWidgets('reads the edits and exif for the asset from the repository', (tester) async {
      final asset = owned();
      final remoteAssetRepo = context.repository.remoteAsset.repo;

      await tester.runAction(context, action, assets: [asset]);

      verify(() => remoteAssetRepo.getAssetEdits(asset.id)).called(1);
      verify(() => remoteAssetRepo.getExif(asset.id)).called(1);
    });
  });

  group('applyEdits', () {
    testWidgets('forwards the edits to the service and waits for both ready events', (tester) async {
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

  group('EditLocationAction', () {
    const action = EditLocationAction();

    testWidgets('visible with an owned remote asset', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [owned()]);

      expect(resolved, isNotNull);
      expect(resolved!.icon, Icons.edit_location_alt_outlined);
      expect(resolved.label, StaticTranslations.instance.control_bottom_app_bar_edit_location);
    });

    testWidgets('hidden without any owned remote asset', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [RemoteAssetFactory.create()]);

      expect(resolved, isNull);
    });

    testWidgets('save persists the location, refreshes the viewer exif and toasts', (tester) async {
      final asset = owned();
      final toast = context.repository.toast;
      when(() => assetService.getExif(asset)).thenAnswer((_) async => null);

      late WidgetRef capturedRef;
      await tester.pumpTestWidget(
        context,
        Consumer(
          builder: (_, ref, _) {
            capturedRef = ref;
            // Keep the exif provider alive so a re-fetch after invalidation is observable.
            ref.watch(assetExifProvider(asset));
            return const SizedBox.shrink();
          },
        ),
      );
      await tester.pumpAndSettle();

      await action.save(capturedRef, [asset.id], const LatLng(1, 2));
      await tester.pumpAndSettle();

      final location =
          verify(() => assetService.update([asset.id], location: captureAny(named: 'location'))).captured.single
              as Option<LatLng>;
      expect(location.unwrapOrNull?.latitude, 1);
      expect(location.unwrapOrNull?.longitude, 2);

      verify(() => assetService.getExif(asset)).called(2);

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.edit_location_action_prompt(count: 1));
    });
  });

  group('EditDateTimeAction', () {
    const action = EditDateTimeAction();

    testWidgets('visible with an owned remote asset', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [owned()]);

      expect(resolved, isNotNull);
      expect(resolved!.icon, Icons.edit_calendar_outlined);
      expect(resolved.label, StaticTranslations.instance.control_bottom_app_bar_edit_time);
    });

    testWidgets('hidden without any owned remote asset', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [RemoteAssetFactory.create()]);

      expect(resolved, isNull);
    });

    testWidgets('save persists the date, refreshes the viewer exif and toasts', (tester) async {
      final asset = owned();
      final toast = context.repository.toast;
      const picked = '2026-06-10T19:15:00.000+06:00';
      when(() => assetService.getExif(asset)).thenAnswer((_) async => null);

      late WidgetRef capturedRef;
      await tester.pumpTestWidget(
        context,
        Consumer(
          builder: (_, ref, _) {
            capturedRef = ref;
            ref.watch(assetExifProvider(asset));
            return const SizedBox.shrink();
          },
        ),
      );
      await tester.pumpAndSettle();

      await action.save(capturedRef, [asset.id], picked);
      await tester.pumpAndSettle();

      verify(() => assetService.update([asset.id], dateTime: const .some(picked))).called(1);
      verify(() => assetService.getExif(asset)).called(2);

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.edit_date_and_time_action_prompt(count: 1));
    });
  });
}
