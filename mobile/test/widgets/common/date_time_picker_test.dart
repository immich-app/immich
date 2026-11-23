import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/utils/timezone.dart';
import 'package:immich_mobile/widgets/common/date_time_picker.dart';
import 'package:timezone/data/latest.dart' as tz;

import '../../widget_tester_extensions.dart';

void main() {
  String? picked;

  setUpAll(tz.initializeTimeZones);

  Future<void> openPicker(WidgetTester tester, String dateTimeOriginal, String timeZone) async {
    picked = null;
    final (dateTime, offset) = applyTimezoneOffset(dateTime: DateTime.parse(dateTimeOriginal), timeZone: timeZone);
    await tester.pumpConsumerWidget(
      Builder(
        builder: (context) => TextButton(
          onPressed: () async => picked = await showDateTimePicker(
            context: context,
            initialDateTime: dateTime,
            initialTZ: timeZone,
            initialTZOffset: offset,
          ),
          child: const Text('open'),
        ),
      ),
    );
    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
  }

  Future<void> update(WidgetTester tester) async {
    await tester.tap(find.text('Update'));
    await tester.pumpAndSettle();
  }

  for (final (zone, date, offset) in [
    ('Europe/Brussels', '2025-07-15', '+02:00'),
    ('Europe/Brussels', '2025-01-15', '+01:00'),
    ('UTC-7', '2025-07-15', '-07:00'),
  ]) {
    testWidgets('$zone on $date opens at $offset and keeps it', (tester) async {
      await openPicker(tester, '${date}T14:00:00$offset', zone);
      expect(find.textContaining('($offset)'), findsOneWidget);

      await update(tester);
      expect(picked, '${date}T14:00:00$offset');
    });
  }

  testWidgets('Caracas in 2010 opens at the -04:00 it uses today', (tester) async {
    await openPicker(tester, '2010-07-15T14:00:00-04:30', 'America/Caracas');
    expect(find.text('America/Caracas (-04:00)'), findsOneWidget);

    await update(tester);
    expect(picked, '2010-07-15T14:00:00-04:00');
  });

  testWidgets('picking a summer date moves the zone to its summer offset', (tester) async {
    await openPicker(tester, '2025-01-15T14:00:00+01:00', 'Europe/Brussels');

    await tester.tap(find.byIcon(Icons.edit_outlined));
    await tester.pumpAndSettle();
    for (var i = 0; i < 6; i++) {
      await tester.tap(find.byTooltip('Next month'));
      await tester.pumpAndSettle();
    }
    await tester.tap(find.text('15'));
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('OK'));
    await tester.pumpAndSettle();
    expect(find.text('Europe/Brussels (+02:00)'), findsOneWidget);

    await update(tester);
    expect(picked, '2025-07-15T14:00:00+02:00');
  });
}
