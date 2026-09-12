import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_handler.provider.dart';

void main() {
  test('returns no handler outside Android', () {
    if (Platform.isAndroid) {
      return;
    }

    final container = ProviderContainer();
    addTearDown(container.dispose);

    expect(container.read(viewIntentHandlerProvider), isNull);
  });
}
