import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/stack.action.dart';
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

  RemoteAsset owned({String? stackId}) => RemoteAssetFactory.create(ownerId: context.currentUser.id, stackId: stackId);

  group('StackAction', () {
    testWidgets('stacks the eligible owned assets', (tester) async {
      final first = owned();
      final second = owned();

      await tester.pumpTestAction(context, StackAction(assets: [first, second]));

      verify(() => assetService.stack(context.currentUser.id, [first.id, second.id])).called(1);
    });

    testWidgets('unstacks the eligible owned assets', (tester) async {
      final asset = owned(stackId: 'stack');

      await tester.pumpTestAction(context, StackAction(assets: [asset]));

      verify(() => assetService.unStack(['stack'])).called(1);
    });

    testWidgets('prioritizes stack when mixed state', (tester) async {
      final first = owned();
      final second = owned(stackId: 'stack');

      await tester.pumpTestAction(context, StackAction(assets: [first, second]));

      verify(() => assetService.stack(context.currentUser.id, [first.id, second.id])).called(1);
    });

    testWidgets('ignores assets owned by someone else', (tester) async {
      final mine = owned();
      final other = owned();
      final theirs = RemoteAssetFactory.create();

      await tester.pumpTestAction(context, StackAction(assets: [mine, other, theirs]));

      verify(() => assetService.stack(context.currentUser.id, [mine.id, other.id])).called(1);
    });

    testWidgets('unstacks every selected stack in a single call', (tester) async {
      final first = owned(stackId: 'stack-1');
      final second = owned(stackId: 'stack-2');

      await tester.pumpTestAction(context, StackAction(assets: [first, second]));

      verify(() => assetService.unStack(['stack-1', 'stack-2'])).called(1);
    });

    testWidgets('shows a confirmation snackbar on success', (tester) async {
      await tester.pumpTestAction(context, StackAction(assets: [owned(), owned()]));
      await tester.pumpUntilFound(find.byType(SnackBar));

      expect(find.byType(SnackBar), findsOneWidget);
    });
  });
}
