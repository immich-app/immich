import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/view_intent/view_intent_pending.provider.dart';

void main() {
  late DateTime now;
  late ProviderContainer container;

  final attachment = ViewIntentPayload(
    path: '/tmp/file.jpg',
    mimeType: 'image/jpeg',
    localAssetId: '42',
  );

  setUp(() {
    now = DateTime(2026, 4, 17, 12);
    container = ProviderContainer(
      overrides: [viewIntentNowProvider.overrideWithValue(() => now)],
    );
    addTearDown(container.dispose);
  });

  test('defer stores pending attachment', () {
    container.read(viewIntentPendingProvider.notifier).defer(attachment);

    expect(container.read(viewIntentPendingProvider), attachment);
  });

  test('takeIfFresh returns pending attachment once', () {
    container.read(viewIntentPendingProvider.notifier).defer(attachment);

    final first = container.read(viewIntentPendingProvider.notifier).takeIfFresh();
    final second = container.read(viewIntentPendingProvider.notifier).takeIfFresh();

    expect(first, attachment);
    expect(second, isNull);
  });

  test('takeIfFresh drops expired attachment', () {
    container.read(viewIntentPendingProvider.notifier).defer(attachment);
    now = now.add(const Duration(minutes: 11));

    final result = container.read(viewIntentPendingProvider.notifier).takeIfFresh();

    expect(result, isNull);
    expect(container.read(viewIntentPendingProvider), isNull);
  });

  test('newer deferred attachment replaces older one', () {
    final newerAttachment = ViewIntentPayload(
      path: '/tmp/file-2.jpg',
      mimeType: 'image/jpeg',
      localAssetId: '43',
    );

    container.read(viewIntentPendingProvider.notifier).defer(attachment);
    container.read(viewIntentPendingProvider.notifier).defer(newerAttachment);

    final result = container.read(viewIntentPendingProvider.notifier).takeIfFresh();

    expect(result, newerAttachment);
  });
}
