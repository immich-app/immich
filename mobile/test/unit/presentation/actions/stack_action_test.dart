import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/stack.action.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:mocktail/mocktail.dart';

import '../../../service.mocks.dart';
import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

void main() {
  late PresentationContext context;
  late MockAssetService assetService;

  setUp(() async {
    context = await PresentationContext.create();
    assetService = context.service.asset.service;
  });

  tearDown(() async {
    await context.dispose();
  });

  RemoteAsset owned({String? stackId}) => RemoteAssetFactory.create(ownerId: context.currentUser.id, stackId: stackId);

  Future<void> pumpStack(WidgetTester tester, Set<BaseAsset> selection) =>
      tester.pumpTestAction(context, const StackAction(source: .timeline), overrides: context.selected(selection));

  group('StackAction', () {
    testWidgets('stacks the eligible owned assets', (tester) async {
      final first = owned();
      final second = owned();

      await pumpStack(tester, {first, second});

      verify(() => assetService.stack(context.currentUser.id, [first.id, second.id])).called(1);
    });

    testWidgets('unstacks the eligible owned assets', (tester) async {
      final asset = owned(stackId: 'stack');

      await pumpStack(tester, {asset});

      verify(() => assetService.unstack(['stack'])).called(1);
    });

    testWidgets('prioritizes stack when mixed state', (tester) async {
      final first = owned();
      final second = owned(stackId: 'stack');

      await pumpStack(tester, {first, second});

      verify(() => assetService.stack(context.currentUser.id, [first.id, second.id])).called(1);
    });

    testWidgets('ignores assets owned by someone else', (tester) async {
      final mine = owned();
      final other = owned();
      final theirs = RemoteAssetFactory.create();

      await pumpStack(tester, {mine, other, theirs});

      verify(() => assetService.stack(context.currentUser.id, [mine.id, other.id])).called(1);
    });

    testWidgets('clears the selection once the stack succeeds', (tester) async {
      await pumpStack(tester, {owned(), owned()});
      await tester.pumpAndSettle();

      expect(find.byType(ImmichIconButton), findsNothing, reason: 'an empty selection hides the action');
    });

    testWidgets('is hidden when a unstacked asset has nothing to stack onto', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(action: StackAction(source: .timeline)),
        overrides: context.selected({owned()}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('is hidden when none of the selected assets are owned', (tester) async {
      await tester.pumpTestWidget(
        context,
        const ActionIconButton(action: StackAction(source: .timeline)),
        overrides: context.selected({RemoteAssetFactory.create(), RemoteAssetFactory.create()}),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });
  });
}
