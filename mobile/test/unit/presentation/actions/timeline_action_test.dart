import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/timeline.action.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';

import '../../factories/remote_asset_factory.dart';
import '../../presentation_context.dart';

class _FakeAction extends BaseAction {
  _FakeAction({this.visible = true, this.error});

  final bool visible;
  final Object? error;

  bool ran = false;
  bool? selectionDuringOnAction;

  @override
  IconData get icon => Icons.bolt;

  @override
  String label(ActionScope scope) => 'fake';

  @override
  bool isVisible(ActionScope scope) => visible;

  @override
  Future<void> onAction(ActionScope scope) async {
    ran = true;
    selectionDuringOnAction = scope.ref.read(multiSelectProvider).isEnabled;
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

  List<Override> seededOverrides() => [
    ...context.overrides,
    multiSelectProvider.overrideWith(
      () => MultiSelectNotifier(
        MultiSelectState(selectedAssets: {RemoteAssetFactory.create()}, lockedSelectionAssets: const {}),
      ),
    ),
  ];

  ProviderContainer containerOf(WidgetTester tester) =>
      ProviderScope.containerOf(tester.element(find.byType(ActionIconButtonWidget)), listen: false);

  group('TimelineAction', () {
    testWidgets('runs the wrapped action and then clears the selection', (tester) async {
      final inner = _FakeAction();

      await tester.pumpTestAction(TimelineAction(action: inner), overrides: seededOverrides());
      await tester.pumpAndSettle();

      expect(inner.ran, isTrue);
      expect(inner.selectionDuringOnAction, isTrue, reason: 'reset must run after the inner action, not before');
      expect(containerOf(tester).read(multiSelectProvider).isEnabled, isFalse);
    });

    testWidgets('clears the selection even when the wrapped action throws', (tester) async {
      final inner = _FakeAction(error: Exception('boom'));

      await tester.pumpTestAction(TimelineAction(action: inner), overrides: seededOverrides());
      await tester.pumpAndSettle();

      expect(inner.ran, isTrue);
      expect(containerOf(tester).read(multiSelectProvider).isEnabled, isFalse);
    });

    testWidgets('delegates visibility to the wrapped action', (tester) async {
      await tester.pumpTestWidget(
        ActionIconButtonWidget(action: TimelineAction(action: _FakeAction(visible: false))),
        overrides: context.overrides,
      );

      expect(find.byType(ActionIconButtonWidget), findsOneWidget);
      expect(find.byIcon(Icons.bolt), findsNothing);
    });
  });
}
