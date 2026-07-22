import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/asset_debug.action.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_ui/immich_ui.dart';

import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;

  setUp(() async {
    context = await PresentationContext.create();
    await StoreService.I.put(StoreKey.advancedTroubleshooting, true);
  });

  tearDown(() {
    context.dispose();
  });

  List<Override> selection(Set<BaseAsset> assets) => [
    multiSelectProvider.overrideWith(
      () => MultiSelectNotifier(MultiSelectState(selectedAssets: assets, lockedSelectionAssets: const {})),
    ),
  ];

  group('AssetDebugAction', () {
    testWidgets('visible for a single asset when advanced troubleshooting is on', (tester) async {
      await tester.pumpTestWidget(
        context,
        const AssetDebugAction(display: ActionDisplay.iconButton),
        overrides: selection({RemoteAssetFactory.create()}),
      );

      expect(find.byType(ImmichIconButton), findsOneWidget);
    });

    testWidgets('hidden for multiple assets', (tester) async {
      await tester.pumpTestWidget(
        context,
        const AssetDebugAction(display: ActionDisplay.iconButton),
        overrides: selection({RemoteAssetFactory.create(), RemoteAssetFactory.create()}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('hidden when advanced troubleshooting is off', (tester) async {
      await StoreService.I.put(StoreKey.advancedTroubleshooting, false);
      await tester.pumpTestWidget(
        context,
        const AssetDebugAction(display: ActionDisplay.iconButton),
        overrides: selection({RemoteAssetFactory.create()}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });
}
