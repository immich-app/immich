import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_ui/src/components/email_input.dart';
import 'package:immich_ui/src/components/password_input.dart';

import 'test_utils.dart';

void main() {
  EditableText editable(WidgetTester tester) => tester.widget<EditableText>(find.byType(EditableText));

  testWidgets('ImmichEmailInput disables smart punctuation', (tester) async {
    await tester.pumpTestWidget(const ImmichEmailInput());

    expect(editable(tester).smartDashesType, SmartDashesType.disabled);
    expect(editable(tester).smartQuotesType, SmartQuotesType.disabled);
  });

  testWidgets('ImmichPasswordInput disables smart punctuation', (tester) async {
    await tester.pumpTestWidget(const ImmichPasswordInput());

    expect(editable(tester).obscureText, isTrue);
    expect(editable(tester).smartDashesType, SmartDashesType.disabled);
    expect(editable(tester).smartQuotesType, SmartQuotesType.disabled);

    await tester.tap(find.byIcon(Icons.visibility_rounded));
    await tester.pump();

    expect(editable(tester).obscureText, isFalse);
    expect(editable(tester).smartDashesType, SmartDashesType.disabled);
    expect(editable(tester).smartQuotesType, SmartQuotesType.disabled);
  });
}
