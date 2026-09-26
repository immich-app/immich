import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/widgets/settings/cast_settings.dart';

import '../presentation_context.dart';

void main() {
  late PresentationContext context;

  setUp(() async => context = await PresentationContext.create());
  tearDown(() => context.dispose());

  testWidgets('enables casting on this device', (tester) async {
    await tester.pumpTestWidget(context, const CastSettings());
    expect(SettingsRepository.instance.appConfig.castEnabled, isFalse);
    await tester.tap(find.byType(Switch));
    await tester.pumpAndSettle();
    expect(SettingsRepository.instance.appConfig.castEnabled, isTrue);
  });

  testWidgets('saves and clears a local receiver override', (tester) async {
    await tester.pumpTestWidget(context, const CastSettings());
    await tester.enterText(find.byType(TextField), ' LOCAL001 ');
    await tester.tap(find.byType(TextButton));
    await tester.pumpAndSettle();
    expect(SettingsRepository.instance.appConfig.castReceiverAppId, 'LOCAL001');

    await tester.enterText(find.byType(TextField), '');
    await tester.tap(find.byType(TextButton));
    await tester.pumpAndSettle();
    expect(SettingsRepository.instance.appConfig.castReceiverAppId, isEmpty);
  });
}
