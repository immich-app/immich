import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_ui/src/color_override.dart';
import 'package:immich_ui/src/components/icon_button.dart';

import 'test_utils.dart';

void main() {
  group('ImmichColorOverride', () {
    testWidgets('exposes the override color to descendants', (tester) async {
      Color? captured;
      await tester.pumpTestWidget(
        ImmichColorOverride(
          color: Colors.green,
          child: Builder(
            builder: (context) {
              captured = ImmichColorOverride.maybeOf(context);
              return const SizedBox.shrink();
            },
          ),
        ),
      );

      expect(captured, Colors.green);
    });

    testWidgets('maybeOf returns null when there is no override', (tester) async {
      Color? captured = Colors.black;
      await tester.pumpTestWidget(
        Builder(
          builder: (context) {
            captured = ImmichColorOverride.maybeOf(context);
            return const SizedBox.shrink();
          },
        ),
      );

      expect(captured, isNull);
    });

    testWidgets('a descendant component adopts the override as its foreground', (tester) async {
      await tester.pumpTestWidget(
        ImmichColorOverride(
          color: Colors.green,
          child: ImmichIconButton(icon: Icons.add, onPressed: () {}),
        ),
      );

      final button = tester.widget<IconButton>(find.byType(IconButton));
      expect(button.style?.foregroundColor?.resolve(<WidgetState>{}), Colors.green);
    });
  });
}
