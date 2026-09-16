import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/presentation/actions/action.widget.dart';
import 'package:immich_mobile/presentation/actions/cast.action.dart';
import 'package:mocktail/mocktail.dart';

import '../presentation_context.dart';

void main() {
  late PresentationContext context;

  setUp(() async {
    context = await PresentationContext.create();
  });

  tearDown(() async {
    await context.dispose();
  });

  void Function(bool) captureConnectionListener() =>
      verify(() => context.service.cast.onConnectionState = captureAny()).captured.single as void Function(bool);

  group('CastAction', () {
    testWidgets('offers to cast when nothing is connected', (tester) async {
      await tester.pumpTestWidget(context, const ActionIconButton(action: CastAction()));

      expect(find.byIcon(Icons.cast_rounded), findsOneWidget);
    });

    testWidgets('switches to the connected icon once casting starts', (tester) async {
      await tester.pumpTestWidget(context, const ActionIconButton(action: CastAction()));

      captureConnectionListener()(true);
      await tester.pump();

      expect(find.byIcon(Icons.cast_connected_rounded), findsOneWidget);
      expect(find.byIcon(Icons.cast_rounded), findsNothing);
    });

    testWidgets('switches back when casting stops', (tester) async {
      await tester.pumpTestWidget(context, const ActionIconButton(action: CastAction()));

      final onConnectionState = captureConnectionListener();
      onConnectionState(true);
      await tester.pump();
      onConnectionState(false);
      await tester.pump();

      expect(find.byIcon(Icons.cast_rounded), findsOneWidget);
    });
  });
}
