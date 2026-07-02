import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/generated/translations.g.dart';
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
      final action = await tester.pumpTestAction(
        context,
        (scope) => StackAction(assets: [first, second], scope: scope),
      );

      expect(action.icon, Icons.filter_none_rounded);
      expect(action.label, StaticTranslations.instance.stack);

      verify(() => assetService.stack(context.currentUser.id, [first.id, second.id])).called(1);
    });

    testWidgets('unstacks the eligible owned assets', (tester) async {
      final asset = owned(stackId: 'stack');
      final action = await tester.pumpTestAction(context, (scope) => StackAction(assets: [asset], scope: scope));

      expect(action.icon, Icons.layers_clear_outlined);
      expect(action.label, StaticTranslations.instance.unstack);

      verify(() => assetService.unstack(['stack'])).called(1);
    });

    testWidgets('prioritizes stack when the owned selection is mixed', (tester) async {
      final first = owned();
      final second = owned(stackId: 'stack');
      final action = await tester.pumpTestAction(
        context,
        (scope) => StackAction(assets: [first, second], scope: scope),
      );

      expect(action.label, StaticTranslations.instance.stack);

      verify(() => assetService.stack(context.currentUser.id, [first.id, second.id])).called(1);
    });

    testWidgets('dispatches on owned state, ignoring assets owned by others', (tester) async {
      final mine = owned();
      final other = owned();
      final theirs = RemoteAssetFactory.create();

      await tester.pumpTestAction(context, (scope) => StackAction(assets: [mine, other, theirs], scope: scope));

      verify(() => assetService.stack(context.currentUser.id, [mine.id, other.id])).called(1);
    });

    testWidgets('unstacks every selected stack in a single call', (tester) async {
      final first = owned(stackId: 'stack-1');
      final second = owned(stackId: 'stack-2');

      await tester.pumpTestAction(context, (scope) => StackAction(assets: [first, second], scope: scope));

      verify(() => assetService.unstack(['stack-1', 'stack-2'])).called(1);
    });

    testWidgets('reports the stacked count through the toast repository', (tester) async {
      final toast = context.repository.toast;

      await tester.pumpTestAction(context, (scope) => StackAction(assets: [owned(), owned()], scope: scope));

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.stacked_assets_count(count: 2));
    });

    testWidgets('reports the unstacked count through the toast repository', (tester) async {
      final toast = context.repository.toast;

      await tester.pumpTestAction(
        context,
        (scope) => StackAction(
          assets: [
            owned(stackId: 'stack-1'),
            owned(stackId: 'stack-2'),
          ],
          scope: scope,
        ),
      );

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.unstacked_assets_count(count: 2));
    });
  });
}
