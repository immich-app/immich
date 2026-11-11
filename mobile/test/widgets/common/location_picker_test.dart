import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/widgets/common/location_picker.dart';
import 'package:maplibre_gl/maplibre_gl.dart';

import '../../widget_tester_extensions.dart';

void main() {
  LatLng? picked;

  Future<void> openPicker(WidgetTester tester, {LatLng? initialLatLng}) async {
    picked = null;
    final router = RootStackRouter.build(
      routes: [
        AutoRoute(
          initial: true,
          page: PageInfo(
            'Home',
            builder: (_) => Builder(
              builder: (context) => TextButton(
                onPressed: () async =>
                    picked = await showLocationPicker(context: context, initialLatLng: initialLatLng),
                child: const Text('open'),
              ),
            ),
          ),
        ),
      ],
    );
    await tester.pumpConsumerWidget(Router.withConfig(config: router.config()));
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
  }

  Future<void> typeAndUpdate(WidgetTester tester, String latitude, String longitude) async {
    await tester.enterText(find.byType(TextField).at(0), latitude);
    await tester.enterText(find.byType(TextField).at(1), longitude);
    await tester.tap(find.text('Update'));
    await tester.pumpAndSettle();
  }

  testWidgets('update saves both typed values when done was pressed in only one field', (tester) async {
    await openPicker(tester);
    await tester.enterText(find.byType(TextField).at(0), '37.7749');
    await tester.enterText(find.byType(TextField).at(1), '-122.4194');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();
    await tester.tap(find.text('Update'));
    await tester.pumpAndSettle();

    expect(picked, const LatLng(37.7749, -122.4194));
  });

  testWidgets('accepts a comma as the decimal separator', (tester) async {
    await openPicker(tester);
    await typeAndUpdate(tester, '45,4642', '9,19');

    expect(picked, const LatLng(45.4642, 9.19));
  });

  testWidgets('an out of range latitude shows the error and saves nothing', (tester) async {
    await openPicker(tester);
    await typeAndUpdate(tester, '95', '9.19');

    expect(picked, isNull);
    expect(find.text('Enter a valid latitude'), findsOneWidget);
  });

  testWidgets('an existing location that is not edited keeps its full value', (tester) async {
    await openPicker(tester, initialLatLng: const LatLng(37.760078, -122.509567));
    await tester.tap(find.byType(TextField).at(0));
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();
    await tester.tap(find.text('Update'));
    await tester.pumpAndSettle();

    expect(picked, const LatLng(37.760078, -122.509567));
  });
}
