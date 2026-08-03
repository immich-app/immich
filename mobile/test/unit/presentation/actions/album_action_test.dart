import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/remove_from_album.action.dart';
import 'package:immich_mobile/presentation/actions/set_album_cover.action.dart';
import 'package:immich_mobile/providers/infrastructure/toast.provider.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../../service.mocks.dart';
import '../../factories/local_asset_factory.dart';
import '../../factories/remote_album_factory.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  const albumId = 'album-1';

  late PresentationContext context;
  late MockRemoteAlbumService albumService;

  setUp(() async {
    context = await PresentationContext.create();
    albumService = context.service.album.service;
  });

  tearDown(() async {
    await context.dispose();
  });

  List<Override> withMockToast() => [toastServiceProvider.overrideWithValue(context.service.toast)];

  group('RemoveFromAlbumAction', () {
    Future<void> pumpRemove(WidgetTester tester, Set<BaseAsset> selection) => tester.pumpTestAction(
      context,
      const RemoveFromAlbumAction(source: .timeline, albumId: albumId),
      overrides: [...context.selected(selection), ...withMockToast()],
    );

    testWidgets('removes every selected remote asset from the album', (tester) async {
      final first = RemoteAssetFactory.create();
      final second = RemoteAssetFactory.create();

      await pumpRemove(tester, {first, second});
      await tester.pumpAndSettle();

      verify(() => albumService.removeAssets(albumId: albumId, assetIds: [first.id, second.id])).called(1);
    });

    testWidgets('reports the count the server actually removed', (tester) async {
      when(
        () => albumService.removeAssets(
          albumId: any(named: 'albumId'),
          assetIds: any(named: 'assetIds'),
        ),
      ).thenAnswer((_) async => 1);

      await pumpRemove(tester, {RemoteAssetFactory.create(), RemoteAssetFactory.create()});
      await tester.pumpAndSettle();

      final message = verify(() => context.service.toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.remove_from_album_action_prompt(count: 1));
    });

    testWidgets('is hidden for a local-only asset', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(
          action: RemoveFromAlbumAction(source: .timeline, albumId: albumId),
        ),
        overrides: context.selected({LocalAssetFactory.create()}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });

  group('SetAlbumCoverAction', () {
    testWidgets('sets the single selected asset as the cover', (tester) async {
      final asset = RemoteAssetFactory.create();
      when(
        () => albumService.updateAlbum(any(), thumbnailAssetId: any(named: 'thumbnailAssetId')),
      ).thenAnswer((_) async => RemoteAlbumFactory.create(id: albumId));

      await tester.pumpTestAction(
        context,
        const SetAlbumCoverAction(source: .timeline, albumId: albumId),
        overrides: [
          ...context.selected({asset}),
          ...withMockToast(),
        ],
      );
      await tester.pumpAndSettle();

      verify(() => albumService.updateAlbum(albumId, thumbnailAssetId: asset.id)).called(1);

      final message = verify(() => context.service.toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.album_cover_updated);
    });

    testWidgets('is hidden for more than one asset', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(
          action: SetAlbumCoverAction(source: .timeline, albumId: albumId),
        ),
        overrides: context.selected({RemoteAssetFactory.create(), RemoteAssetFactory.create()}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('is hidden for a local-only asset', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(
          action: SetAlbumCoverAction(source: .timeline, albumId: albumId),
        ),
        overrides: context.selected({LocalAssetFactory.create()}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });
}
