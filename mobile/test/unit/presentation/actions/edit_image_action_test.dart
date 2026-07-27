import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/edit_image.action.dart';
import 'package:immich_mobile/providers/routes.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/services/server_info.service.dart';
import 'package:immich_mobile/utils/semver.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../factories/local_asset_factory.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

class _MockServerInfoService extends Mock implements ServerInfoService {}

class _StubServerInfoNotifier extends ServerInfoNotifier {
  _StubServerInfoNotifier(ServerVersion version) : super(_MockServerInfoService()) {
    state = state.copyWith(serverVersion: version);
  }
}

void main() {
  late PresentationContext context;

  const editCapableVersion = ServerVersion(major: 2, minor: 6, patch: 0);

  setUp(() async {
    context = await PresentationContext.create();
  });

  tearDown(() {
    context.dispose();
  });

  Future<void> pumpAction(
    WidgetTester tester,
    EditImageAction action, {
    ServerVersion serverVersion = editCapableVersion,
    bool isInLockedView = false,
  }) async {
    await tester.pumpTestWidget(
      context,
      ActionIconButtonWidget(action: action),
      overrides: [
        serverInfoProvider.overrideWith((ref) => _StubServerInfoNotifier(serverVersion)),
        inLockedViewProvider.overrideWith((ref) => isInLockedView),
      ],
    );
  }

  group('EditImageAction', () {
    testWidgets('visible for an editable remote asset on a capable server', (tester) async {
      await pumpAction(tester, EditImageAction(assets: [RemoteAssetFactory.create()]));

      expect(find.byType(ImmichIconButton), findsOneWidget);
    });

    testWidgets('hidden for a local-only asset', (tester) async {
      await pumpAction(tester, EditImageAction(assets: [LocalAssetFactory.create()]));

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('hidden when the server is older than 2.6.0', (tester) async {
      await pumpAction(
        tester,
        EditImageAction(assets: [RemoteAssetFactory.create()]),
        serverVersion: const ServerVersion(major: 2, minor: 5, patch: 9),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('hidden in the locked view', (tester) async {
      await pumpAction(tester, EditImageAction(assets: [RemoteAssetFactory.create()]), isInLockedView: true);

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('hidden for multiple assets', (tester) async {
      await pumpAction(tester, EditImageAction(assets: [RemoteAssetFactory.create(), RemoteAssetFactory.create()]));

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });

  group('EditImageAction.canShow', () {
    test('requires an editable asset, no locked view, and server >= 2.6.0', () {
      final asset = RemoteAssetFactory.create();

      expect(EditImageAction.canShow(asset: asset, isInLockedView: false, serverVersion: editCapableVersion), isTrue);
      expect(EditImageAction.canShow(asset: asset, isInLockedView: true, serverVersion: editCapableVersion), isFalse);
      expect(
        EditImageAction.canShow(
          asset: asset,
          isInLockedView: false,
          serverVersion: const SemVer(major: 2, minor: 5, patch: 9),
        ),
        isFalse,
      );
      expect(
        EditImageAction.canShow(
          asset: LocalAssetFactory.create(),
          isInLockedView: false,
          serverVersion: editCapableVersion,
        ),
        isFalse,
      );
    });
  });
}
