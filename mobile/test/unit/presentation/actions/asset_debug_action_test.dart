import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/presentation/actions/asset_debug.action.dart';

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

  const action = AssetDebugAction();

  group('AssetDebugAction', () {
    testWidgets('visible for a single asset when advanced troubleshooting is on', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [RemoteAssetFactory.create()]);

      expect(resolved, isNotNull);
    });

    testWidgets('hidden for multiple assets', (tester) async {
      final resolved = await tester.resolveAction(
        context,
        action,
        assets: [RemoteAssetFactory.create(), RemoteAssetFactory.create()],
      );

      expect(resolved, isNull);
    });

    testWidgets('hidden when advanced troubleshooting is off', (tester) async {
      await StoreService.I.put(StoreKey.advancedTroubleshooting, false);
      final resolved = await tester.resolveAction(context, action, assets: [RemoteAssetFactory.create()]);

      expect(resolved, isNull);
    });
  });
}
