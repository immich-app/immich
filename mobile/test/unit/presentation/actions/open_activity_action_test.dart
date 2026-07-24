import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/album.model.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/open_activity.action.dart';
import 'package:immich_mobile/providers/infrastructure/current_album.provider.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_ui/immich_ui.dart';

import '../../factories/remote_album_factory.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

class _StubAlbumNotifier extends CurrentAlbumNotifier {
  _StubAlbumNotifier(this.album);

  final RemoteAlbum? album;

  @override
  RemoteAlbum? build() => album;
}

void main() {
  late PresentationContext context;

  setUp(() async {
    context = await PresentationContext.create();
  });

  tearDown(() {
    context.dispose();
  });

  Future<void> pumpAction(
    WidgetTester tester, {
    RemoteAlbum? album,
    bool isInLockedView = false,
    List<Override> overrides = const [],
  }) async {
    await tester.pumpTestWidget(
      context,
      ActionIconButtonWidget(action: OpenActivityAction(assets: [RemoteAssetFactory.create()])),
      overrides: [
        currentRemoteAlbumProvider.overrideWith(() => _StubAlbumNotifier(album)),
        inLockedViewProvider.overrideWith((ref) => isInLockedView),
        ...overrides,
      ],
    );
  }

  group('OpenActivityAction', () {
    testWidgets('visible in a shared album with activity enabled', (tester) async {
      await pumpAction(tester, album: RemoteAlbumFactory.create(isShared: true, isActivityEnabled: true));

      expect(find.byType(ImmichIconButton), findsOneWidget);
    });

    testWidgets('hidden when there is no current album', (tester) async {
      await pumpAction(tester, album: null);

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('hidden when the album is not shared', (tester) async {
      await pumpAction(tester, album: RemoteAlbumFactory.create(isShared: false, isActivityEnabled: true));

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('hidden when activity is disabled', (tester) async {
      await pumpAction(tester, album: RemoteAlbumFactory.create(isShared: true, isActivityEnabled: false));

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('hidden in the locked view', (tester) async {
      await pumpAction(
        tester,
        album: RemoteAlbumFactory.create(isShared: true, isActivityEnabled: true),
        isInLockedView: true,
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });
}
