import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/presentation/actions/action.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_ui/immich_ui.dart';

import '../presentation_context.dart';

class _RecordingAction extends BaseAction {
  final void Function() onTap;
  final void Function()? onLong;
  final bool visible;

  const _RecordingAction({required this.onTap, this.onLong, this.visible = true});

  @override
  IconData get icon => Icons.bug_report_outlined;

  @override
  String label(_) => 'test';

  @override
  bool isVisible(WidgetRef ref, Iterable<BaseAsset> assets) => visible;

  @override
  Future<void> onAction(WidgetRef ref, Iterable<BaseAsset> assets) async => onTap();

  @override
  Future<void> Function(WidgetRef ref, Iterable<BaseAsset> assets)? get onSecondaryAction {
    final onLong = this.onLong;
    return onLong == null ? null : (ref, assets) async => onLong();
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

  group('Action Widgets', () {
    testWidgets('renders nothing when the action is not visible', (tester) async {
      await tester.pumpTestWidget(
        context,
        ActionIconButtonWidget(action: _RecordingAction(onTap: () {}, visible: false)),
      );

      expect(find.byType(ImmichIconButton), findsNothing);
    });

    testWidgets('wires no long press handler when the action has no secondary action', (tester) async {
      await tester.pumpTestWidget(context, ActionIconButtonWidget(action: _RecordingAction(onTap: () {})));

      expect(tester.widget<ImmichIconButton>(find.byType(ImmichIconButton)).onLongPress, isNull);
    });

    testWidgets('tap runs the primary action', (tester) async {
      var taps = 0;
      var longPresses = 0;
      await tester.pumpTestWidget(
        context,
        ActionIconButtonWidget(
          action: _RecordingAction(onTap: () => taps++, onLong: () => longPresses++),
        ),
      );

      await tester.tap(find.byType(ImmichIconButton));
      await tester.pump();

      expect(taps, 1);
      expect(longPresses, 0);
    });

    testWidgets('long press runs the secondary action, not the primary', (tester) async {
      var taps = 0;
      var longPresses = 0;
      await tester.pumpTestWidget(
        context,
        ActionIconButtonWidget(
          action: _RecordingAction(onTap: () => taps++, onLong: () => longPresses++),
        ),
      );

      await tester.longPress(find.byType(ImmichIconButton));
      await tester.pump();

      expect(longPresses, 1);
      expect(taps, 0);
    });
  });
}
