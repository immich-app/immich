import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/timeline.action.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

import '../../factories/remote_asset_factory.dart';
import '../presentation_context.dart';

class _FakeAction extends BaseAction {
  _FakeAction({this.visible = true, this.error});

  final bool visible;
  final Object? error;

  bool ran = false;
  bool? selectionDuringOnAction;

  @override
  IconData icon(_) => Icons.bolt;

  @override
  String label(_) => 'fake';

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => visible;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async {
    ran = true;
    selectionDuringOnAction = ref.read(multiSelectProvider).isEnabled;
    if (error != null) {
      throw error!;
    }
  }
}

void main() {
  late PresentationContext context;

  setUp(() async {
    context = await PresentationContext.create();
  });

  tearDown(() {
    context.dispose();
  });

  List<Override> overrides() => [
    multiSelectProvider.overrideWith(
      () => MultiSelectNotifier(
        MultiSelectState(selectedAssets: {RemoteAssetFactory.create()}, lockedSelectionAssets: const {}),
      ),
    ),
  ];

  Future<(WidgetRef, ProviderContainer)> pumpScope(WidgetTester tester) async {
    late WidgetRef widgetRef;
    late ProviderContainer container;
    await tester.pumpTestWidget(
      context,
      Consumer(
        builder: (innerContext, ref, _) {
          widgetRef = ref;
          container = ProviderScope.containerOf(innerContext, listen: false);
          return const SizedBox.shrink();
        },
      ),
      overrides: overrides(),
    );
    return (widgetRef, container);
  }

  group('TimelineAction', () {
    testWidgets('runs the wrapped action and then clears the selection', (tester) async {
      final (ref, container) = await pumpScope(tester);
      final inner = _FakeAction();

      await TimelineAction(action: inner).onAction(ref, const []);

      expect(inner.ran, isTrue);
      expect(inner.selectionDuringOnAction, isTrue, reason: 'reset must run after the inner action, not before');
      expect(container.read(multiSelectProvider).isEnabled, isFalse);
    });

    testWidgets('rethrows and keeps the selection when the wrapped action throws', (tester) async {
      final error = Exception('crash');
      final (ref, container) = await pumpScope(tester);
      final inner = _FakeAction(error: error);

      await expectLater(TimelineAction(action: inner).onAction(ref, const []), throwsA(same(error)));

      expect(inner.ran, isTrue);
      expect(container.read(multiSelectProvider).isEnabled, isTrue);
    });

    testWidgets('delegates visibility to the wrapped action', (tester) async {
      final resolved = await tester.resolveAction(context, TimelineAction(action: _FakeAction(visible: false)));

      expect(resolved, isNull);
    });
  });
}
