import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_ui/immich_ui.dart';

import '../presentation_context.dart';

class _RecordingAction extends BaseAction {
  final void Function() onTap;
  final void Function()? onLong;

  const _RecordingAction._({
    required this.onTap,
    required this.onLong,
    required super.scope,
    required super.icon,
    required super.label,
    super.isVisible,
  });

  factory _RecordingAction(
    ActionScope scope, {
    required void Function() onTap,
    void Function()? onLong,
    bool isVisible = true,
  }) => _RecordingAction._(
    scope: scope,
    onTap: onTap,
    onLong: onLong,
    icon: Icons.bug_report_outlined,
    label: 'test',
    isVisible: isVisible,
  );

  @override
  Future<void> onAction() async => onTap();

  @override
  Future<void> Function()? get onSecondaryAction {
    final callback = onLong;
    return callback == null ? null : () async => callback();
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

  group('ActionIconButtonWidget', () {
    testWidgets('renders nothing when the action is not visible', (tester) async {
      await tester.pumpActionButton(context, (scope) => _RecordingAction(scope, onTap: () {}, isVisible: false));

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('wires no long press handler when the action has no secondary action', (tester) async {
      await tester.pumpActionButton(context, (scope) => _RecordingAction(scope, onTap: () {}));

      expect(tester.widget<ImmichIconButton>(find.byType(ImmichIconButton)).onLongPress, isNull);
    });

    testWidgets('tap runs the primary action', (tester) async {
      var taps = 0;
      var longPresses = 0;
      await tester.pumpActionButton(
        context,
        (scope) => _RecordingAction(scope, onTap: () => taps++, onLong: () => longPresses++),
      );

      await tester.tap(find.byType(ImmichIconButton));
      await tester.pump();

      expect(taps, 1);
      expect(longPresses, 0);
    });

    testWidgets('long press runs the secondary action, not the primary', (tester) async {
      var taps = 0;
      var longPresses = 0;
      await tester.pumpActionButton(
        context,
        (scope) => _RecordingAction(scope, onTap: () => taps++, onLong: () => longPresses++),
      );

      await tester.longPress(find.byType(ImmichIconButton));
      await tester.pump();

      expect(longPresses, 1);
      expect(taps, 0);
    });
  });
}
