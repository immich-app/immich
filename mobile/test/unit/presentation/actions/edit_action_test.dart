import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/edit_asset.action.dart';
import 'package:immich_mobile/presentation/actions/edit_datetime.action.dart';
import 'package:immich_mobile/presentation/actions/edit_location.action.dart';
import 'package:immich_mobile/providers/infrastructure/asset_viewer/asset.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/utils/option.dart';
import 'package:immich_ui/immich_ui.dart';
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

  group('EditImageAction', () {
    testWidgets('visible for a single owned editable asset on a supported server', (tester) async {
      final action = await tester.pumpActionButton(
        context,
        (scope) => EditAssetAction(assets: [owned()], scope: scope),
      );

      expect(action.isVisible, isTrue);
      expect(action.icon, Icons.tune);
      expect(action.label, StaticTranslations.instance.edit);
      expect(find.byType(ImmichIconButton), findsOneWidget);
    });

    testWidgets('hidden when the server is older than 2.6.0', (tester) async {
      final action = await tester.pumpActionButton(
        context,
        (scope) => EditAssetAction(assets: [owned()], scope: scope),
        overrides: serverVersion(unsupportedVersion),
      );

      expect(action.isVisible, isFalse);
      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('hidden for more than one asset', (tester) async {
      final action = await tester.pumpActionButton(
        context,
        (scope) => EditAssetAction(assets: [owned(), owned()], scope: scope),
      );

      expect(action.isVisible, isFalse);
    });

    testWidgets('hidden for an asset owned by someone else', (tester) async {
      final action = await tester.pumpActionButton(
        context,
        (scope) => EditAssetAction(assets: [RemoteAssetFactory.create()], scope: scope),
      );

      expect(action.isVisible, isFalse);
    });

    testWidgets('hidden for a non-editable asset', (tester) async {
      final action = await tester.pumpActionButton(
        context,
        (scope) => EditAssetAction(
          assets: [owned(type: AssetType.video)],
          scope: scope,
        ),
      );

      expect(action.isVisible, isFalse);
    });

    testWidgets('reads the edits and exif for the asset from the repository', (tester) async {
      final asset = owned();
      final remoteAssetRepo = context.repository.remoteAsset.repo;

      await tester.pumpTestAction(context, (scope) => EditAssetAction(assets: [asset], scope: scope));
      await tester.pumpAndSettle();

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
    testWidgets('visible with an owned remote asset', (tester) async {
      final action = await tester.pumpActionButton(
        context,
        (scope) => EditLocationAction(assets: [owned()], scope: scope),
      );

      expect(action.isVisible, isTrue);
      expect(action.icon, Icons.edit_location_alt_outlined);
      expect(action.label, StaticTranslations.instance.control_bottom_app_bar_edit_location);
    });

    testWidgets('hidden without any owned remote asset', (tester) async {
      final action = await tester.pumpActionButton(
        context,
        (scope) => EditLocationAction(assets: [RemoteAssetFactory.create()], scope: scope),
      );

      expect(action.isVisible, isFalse);
    });

    testWidgets('collects only the owned remote asset ids', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create();

      final action = await tester.pumpActionButton(
        context,
        (scope) => EditLocationAction(assets: [mine, theirs], scope: scope),
      );

      expect((action as EditLocationAction).assetIds, [mine.id]);
    });

    testWidgets('save persists the location, refreshes the viewer exif and toasts', (tester) async {
      final asset = owned();
      final toast = context.repository.toast;
      when(() => assetService.getExif(asset)).thenAnswer((_) async => null);

      late EditLocationAction action;
      await tester.pumpTestWidget(
        context,
        Consumer(
          builder: (ctx, ref, _) {
            action = EditLocationAction(
              assets: [asset],
              scope: ActionScope(context: ctx, ref: ref, authUser: context.currentUser),
            );
            // Keep the exif provider alive so a re-fetch after invalidation is observable.
            ref.watch(assetExifProvider(asset));
            return const SizedBox.shrink();
          },
        ),
      );
      await tester.pumpAndSettle();

      await action.save(const LatLng(1, 2));
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
    testWidgets('visible with an owned remote asset', (tester) async {
      final action = await tester.pumpActionButton(
        context,
        (scope) => EditDateTimeAction(assets: [owned()], scope: scope),
      );

      expect(action.isVisible, isTrue);
      expect(action.icon, Icons.edit_calendar_outlined);
      expect(action.label, StaticTranslations.instance.control_bottom_app_bar_edit_time);
    });

    testWidgets('hidden without any owned remote asset', (tester) async {
      final action = await tester.pumpActionButton(
        context,
        (scope) => EditDateTimeAction(assets: [RemoteAssetFactory.create()], scope: scope),
      );

      expect(action.isVisible, isFalse);
    });

    testWidgets('collects only the owned remote asset ids', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create();

      final action = await tester.pumpActionButton(
        context,
        (scope) => EditDateTimeAction(assets: [mine, theirs], scope: scope),
      );

      expect((action as EditDateTimeAction).assetIds, [mine.id]);
    });

    testWidgets('save persists the date, refreshes the viewer exif and toasts', (tester) async {
      final asset = owned();
      final toast = context.repository.toast;
      const picked = '2026-06-10T19:15:00.000+06:00';
      when(() => assetService.getExif(asset)).thenAnswer((_) async => null);

      late EditDateTimeAction action;
      await tester.pumpTestWidget(
        context,
        Consumer(
          builder: (ctx, ref, _) {
            action = EditDateTimeAction(
              assets: [asset],
              scope: ActionScope(context: ctx, ref: ref, authUser: context.currentUser),
            );
            // Keep the exif provider alive so a re-fetch after invalidation is observable.
            ref.watch(assetExifProvider(asset));
            return const SizedBox.shrink();
          },
        ),
      );
      await tester.pumpAndSettle();

      await action.save(picked);
      await tester.pumpAndSettle();

      verify(() => assetService.update([asset.id], dateTime: const Some(picked))).called(1);
      verify(() => assetService.getExif(asset)).called(2);

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.edit_date_and_time_action_prompt(count: 1));
    });
  });
}
