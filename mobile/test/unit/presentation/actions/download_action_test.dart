import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/download.action.dart';
import 'package:mocktail/mocktail.dart';

import '../../../repository.mocks.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockDownloadRepository downloadRepo;

  setUp(() async {
    context = await PresentationContext.create();
    downloadRepo = context.repository.download.repo;
  });

  tearDown(() {
    context.dispose();
  });

  const action = DownloadAction();

  group('DownloadAction', () {
    testWidgets('visible when there is a remote asset to download', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [RemoteAssetFactory.create()]);

      expect(resolved, isNotNull);
      expect(resolved!.icon, Icons.download);
      expect(resolved.label, StaticTranslations.instance.download);
    });

    testWidgets('hidden when the selection has no remote assets', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: const []);

      expect(resolved, isNull);
    });

    testWidgets('enqueues the downloads and re-syncs shortly after', (tester) async {
      final target = RemoteAssetFactory.create();
      final backgroundSync = context.service.backgroundSync;

      await tester.runAction(context, action, assets: [target]);

      verify(() => downloadRepo.downloadAllAssets(any(that: contains(target)))).called(1);

      // Sync is scheduled to run after a 1 second delay
      await tester.pump(const Duration(seconds: 1));
      await tester.pumpAndSettle();
      verify(() => backgroundSync.syncLocal()).called(1);
      verify(() => backgroundSync.hashAssets()).called(1);
    });
  });
}
