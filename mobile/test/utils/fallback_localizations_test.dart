import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../widget_tester_extensions.dart';

void main() {
  testWidgets('Material and Cupertino widgets work in languages Flutter has no translations for', (tester) async {
    await tester.pumpConsumerWidget(
      const Column(children: [BackButton(), CupertinoSearchTextField()]),
      locale: const Locale('mi'),
    );

    expect(find.byTooltip('Back'), findsOneWidget);
    expect(find.text('Search'), findsOneWidget);
  });
}
