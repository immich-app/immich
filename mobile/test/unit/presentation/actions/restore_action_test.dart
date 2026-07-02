import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
import 'package:immich_mobile/presentation/actions/restore.action.dart';
import 'package:mocktail/mocktail.dart';

import '../../../domain/service.mock.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockAssetService assetService;

  setUp(() async {
    context = await PresentationContext.create();
    assetService = context.service.asset.service;
  });

  tearDown(() {
    context.dispose();
  });

  RemoteAsset owned({bool trashed = true}) =>
      RemoteAssetFactory.create(ownerId: context.currentUser.id, deletedAt: trashed ? DateTime(2020) : null);

  group('RestoreAction', () {
    testWidgets('restores the eligible owned trashed assets', (tester) async {
      final asset = owned();

      await tester.pumpTestAction(context, RestoreAction(assets: [asset]));

      verify(() => assetService.restoreTrash([asset.id])).called(1);
    });

    testWidgets('ignores assets owned by someone else', (tester) async {
      final mine = owned();
      final theirs = RemoteAssetFactory.create(deletedAt: DateTime(2020));

      await tester.pumpTestAction(context, RestoreAction(assets: [mine, theirs]));

      verify(() => assetService.restoreTrash([mine.id])).called(1);
    });

    testWidgets('restores only the owned assets that are trashed', (tester) async {
      final trashed = owned();
      final live = owned(trashed: false);

      await tester.pumpTestAction(context, RestoreAction(assets: [trashed, live]));

      verify(() => assetService.restoreTrash([trashed.id])).called(1);
    });

    testWidgets('batches every eligible owned asset into a single call', (tester) async {
      final first = owned();
      final second = owned();

      await tester.pumpTestAction(context, RestoreAction(assets: [first, second]));

      verify(() => assetService.restoreTrash([first.id, second.id])).called(1);
    });

    testWidgets('reports success through the toast repository with the restored count', (tester) async {
      final toast = context.repository.toast;

      await tester.pumpTestAction(context, RestoreAction(assets: [owned(), owned()]));

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.assets_restored_count(count: 2));
    });
  });
}
