import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_ui/src/snackbar.dart';

import 'test_utils.dart';

void main() {
  group('SnackbarManager', () {
    testWidgets('shows the message', (tester) async {
      await tester.pumpTestWidget(const SizedBox());

      snackbar.success('hello');
      await tester.pump();

      expect(find.text('hello'), findsOneWidget);
      expect(find.byType(SnackBar), findsOneWidget);
    });

    testWidgets('replaces the current snackbar', (tester) async {
      await tester.pumpTestWidget(const SizedBox());

      snackbar.info('first');
      await tester.pump();
      snackbar.error('second');
      await tester.pump();

      expect(find.text('first'), findsNothing);
      expect(find.text('second'), findsOneWidget);
    });

    testWidgets('no-ops when the messenger is unmounted', (tester) async {
      expect(snackbar.show('x', .info), isNull);
    });
  });
}
