import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/download.action.dart';
import 'package:immich_ui/immich_ui.dart';
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

  group('DownloadAction', () {
    testWidgets('visible when there is a remote asset to download', (tester) async {
      final action = await tester.pumpActionButton(
        context,
        (scope) => DownloadAction(assets: [RemoteAssetFactory.create()], scope: scope),
      );

      expect(action.isVisible, isTrue);
      expect(action.icon, Icons.download);
      expect(action.label, StaticTranslations.instance.download);
      expect(find.byType(ImmichIconButton), findsOneWidget);
    });

    testWidgets('hidden when the selection has no remote assets', (tester) async {
      final action = await tester.pumpActionButton(context, (scope) => DownloadAction(assets: const [], scope: scope));

      expect(action.isVisible, isFalse);
      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('enqueues the downloads and re-syncs shortly after', (tester) async {
      final target = RemoteAssetFactory.create();
      final backgroundSync = context.service.backgroundSync;

      await tester.pumpTestAction(context, (scope) => DownloadAction(assets: [target], scope: scope));

      verify(() => downloadRepo.downloadAllAssets(any(that: contains(target)))).called(1);

      // Sync is scheduled to run after a 1 second delay
      await tester.pump(const Duration(seconds: 1));
      await tester.pumpAndSettle();
      verify(() => backgroundSync.syncLocal()).called(1);
      verify(() => backgroundSync.hashAssets()).called(1);
    });
  });
}
