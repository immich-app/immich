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
    const action = StackAction();

    testWidgets('stacks the eligible owned assets', (tester) async {
      final first = owned();
      final second = owned();
      final resolved = await tester.runAction(context, action, assets: [first, second]);

      expect(resolved!.icon, Icons.filter_none_rounded);
      expect(resolved.label, StaticTranslations.instance.stack);
      verify(() => assetService.stack(context.currentUser.id, [first.id, second.id])).called(1);
    });

    testWidgets('stacks a mixed owned selection into one stack', (tester) async {
      final first = owned();
      final second = owned(stackId: 'stack');

      await tester.runAction(context, action, assets: [first, second]);

      verify(() => assetService.stack(context.currentUser.id, [first.id, second.id])).called(1);
    });

    testWidgets('ignores assets owned by others', (tester) async {
      final mine = owned();
      final other = owned();
      final theirs = RemoteAssetFactory.create();

      await tester.runAction(context, action, assets: [mine, other, theirs]);

      verify(() => assetService.stack(context.currentUser.id, [mine.id, other.id])).called(1);
    });

    testWidgets('is hidden for a single asset', (tester) async {
      final resolved = await tester.resolveAction(context, action, assets: [owned()]);

      expect(resolved, isNull);
    });

    testWidgets('reports the stacked count through the toast repository', (tester) async {
      final toast = context.repository.toast;

      await tester.runAction(context, action, assets: [owned(), owned()]);

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.stacked_assets_count(count: 2));
    });
  });

  group('UnstackAction', () {
    const action = UnstackAction();

    testWidgets('unstacks the owned assets when every one is stacked', (tester) async {
      final asset = owned(stackId: 'stack');
      final resolved = await tester.runAction(context, action, assets: [asset]);

      expect(resolved!.icon, Icons.layers_clear_outlined);
      expect(resolved.label, StaticTranslations.instance.unstack);
      verify(() => assetService.unstack(['stack'])).called(1);
    });

    testWidgets('unstacks every selected stack in a single call', (tester) async {
      final first = owned(stackId: 'stack-1');
      final second = owned(stackId: 'stack-2');

      await tester.runAction(context, action, assets: [first, second]);

      verify(() => assetService.unstack(['stack-1', 'stack-2'])).called(1);
    });

    testWidgets('reports the unstacked count through the toast repository', (tester) async {
      final toast = context.repository.toast;

      await tester.runAction(
        context,
        action,
        assets: [owned(stackId: 'stack-1'), owned(stackId: 'stack-2')],
      );

      final message = verify(() => toast.success(captureAny())).captured.single as String;
      expect(message, StaticTranslations.instance.unstacked_assets_count(count: 2));
    });
  });

  group('toggle visibility', () {
    testWidgets('a mixed selection shows Stack but not Unstack', (tester) async {
      final assets = [owned(), owned(stackId: 'stack')];

      final stack = await tester.resolveAction(context, const StackAction(), assets: assets);
      final unstack = await tester.resolveAction(context, const UnstackAction(), assets: assets);

      expect(stack, isNotNull);
      expect(unstack, isNull);
    });

    testWidgets('an all-stacked selection shows Unstack but not Stack', (tester) async {
      final assets = [owned(stackId: 'stack-1'), owned(stackId: 'stack-2')];

      final stack = await tester.resolveAction(context, const StackAction(), assets: assets);
      final unstack = await tester.resolveAction(context, const UnstackAction(), assets: assets);

      expect(stack, isNull);
      expect(unstack, isNotNull);
    });
  });
}
