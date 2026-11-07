import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_ui/src/components/column_button.dart';
import 'package:immich_ui/src/components/icon_button.dart';
import 'package:immich_ui/src/components/text_button.dart';

import 'test_utils.dart';

void main() {
  Future<void> tapTwiceInOneFrame(WidgetTester tester, Widget Function(Future<void> Function() onPressed) build) async {
    var runs = 0;
    final action = Completer<void>();
    final button = build(() {
      runs++;
      return action.future;
    });
    await tester.pumpTestWidget(button);

    await tester.tap(find.byWidget(button));
    await tester.tap(find.byWidget(button));
    expect(runs, 1);

    action.complete();
    await tester.pump();
    await tester.tap(find.byWidget(button));
    expect(runs, 2);
  }

  testWidgets('ImmichTextButton runs its action once for two taps in one frame', (tester) async {
    await tapTwiceInOneFrame(tester, (onPressed) => ImmichTextButton(labelText: 'Save', onPressed: onPressed));
  });

  testWidgets('ImmichIconButton runs its action once for two taps in one frame', (tester) async {
    await tapTwiceInOneFrame(tester, (onPressed) => ImmichIconButton(icon: Icons.add, onPressed: onPressed));
  });

  testWidgets('ImmichColumnButton runs its action once for two taps in one frame', (tester) async {
    await tapTwiceInOneFrame(
      tester,
      (onPressed) => ImmichColumnButton(icon: Icons.share, label: 'Share', onPressed: onPressed),
    );
  });
}
