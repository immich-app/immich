import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
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
  ActionView resolve(ActionScope scope) => _FakeActionView(this, scope);
}

class _FakeActionView extends ActionView {
  final _FakeAction action;

  _FakeActionView(this.action, ActionScope scope) : super(scope: scope);

  @override
  IconData get icon => Icons.bolt;

  @override
  String get label => 'fake';

  @override
  bool get isVisible => action.visible;

  @override
  Future<void> onAction() async {
    action.ran = true;
    action.selectionDuringOnAction = scope.ref.read(multiSelectProvider).isEnabled;
    if (action.error != null) {
      throw action.error!;
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

  Future<(ActionScope, ProviderContainer)> pumpScope(WidgetTester tester) async {
    late ActionScope scope;
    late ProviderContainer container;
    await tester.pumpTestWidget(
      context,
      Consumer(
        builder: (innerContext, ref, _) {
          scope = ActionScope(context: innerContext, ref: ref, authUser: context.currentUser);
          container = ProviderScope.containerOf(innerContext, listen: false);
          return const SizedBox.shrink();
        },
      ),
      overrides: overrides(),
    );
    return (scope, container);
  }

  group('TimelineAction', () {
    testWidgets('runs the wrapped action and then clears the selection', (tester) async {
      final inner = _FakeAction();
      final (scope, container) = await pumpScope(tester);
      await TimelineAction(action: inner).resolve(scope).onAction();

      expect(inner.ran, isTrue);
      expect(inner.selectionDuringOnAction, isTrue, reason: 'reset must run after the inner action, not before');
      expect(container.read(multiSelectProvider).isEnabled, isFalse);
    });

    testWidgets('rethrows and keeps the selection when the wrapped action throws', (tester) async {
      final error = Exception('boom');
      final inner = _FakeAction(error: error);
      final (scope, container) = await pumpScope(tester);

      await expectLater(TimelineAction(action: inner).resolve(scope).onAction(), throwsA(same(error)));

      expect(inner.ran, isTrue);
      expect(container.read(multiSelectProvider).isEnabled, isTrue);
    });

    testWidgets('delegates visibility to the wrapped action', (tester) async {
      await tester.pumpTestWidget(
        context,
        ActionIconButtonWidget(action: TimelineAction(action: _FakeAction(visible: false))),
      );

      expect(find.byType(ActionIconButtonWidget), findsOneWidget);
      expect(find.byIcon(Icons.bolt), findsNothing);
    });
  });
}
