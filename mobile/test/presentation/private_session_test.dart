import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/server/pin.dart';
import 'package:immich_mobile/domain/models/tag.model.dart';
import 'package:immich_mobile/presentation/pages/tags.page.dart';
import 'package:immich_mobile/providers/private_session.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../unit/presentation/presentation_context.dart';

class _PinApi extends Mock implements PinApiRepository {}

void main() {
  testWidgets('the Tags screen shows private tags only during an unlocked session', (tester) async {
    final api = _PinApi();
    when(
      api.getPinStatus,
    ).thenAnswer((_) async => (isConfigured: true, expiresAt: DateTime.now().add(const Duration(minutes: 1))));
    when(api.lockPinCode).thenAnswer((_) async {});
    final context = await PresentationContext.create(pinApi: api);
    addTearDown(context.dispose);
    when(context.service.tag.getAll).thenAnswer(
      (_) async => const [Tag(id: 'travel', value: 'Travel'), Tag(id: 'family', value: 'Family', isPrivate: true)],
    );

    await tester.pumpTestWidget(context, const TagsPage());
    final provider = ProviderScope.containerOf(tester.element(find.byType(TagsPage)));
    expect(find.text('Travel'), findsOneWidget);
    expect(find.text('Family'), findsNothing);

    expect(await provider.read(privateSessionProvider.notifier).activate(), isTrue);
    await tester.pumpAndSettle();
    expect(find.text('Family'), findsOneWidget);

    await provider.read(privateSessionProvider.notifier).lock();
    await tester.pumpAndSettle();
    expect(find.text('Family'), findsNothing);
    expect(find.text('Travel'), findsOneWidget);
  });

  testWidgets('private content relocks when the server PIN session expires', (tester) async {
    final api = _PinApi();
    when(
      api.getPinStatus,
    ).thenAnswer((_) async => (isConfigured: true, expiresAt: DateTime.now().add(const Duration(seconds: 5))));
    final session = PrivateSession(api);
    addTearDown(session.dispose);
    final states = <bool>[];
    session.addListener(states.add);

    expect(await session.activate(), isTrue);
    await tester.pump(const Duration(seconds: 6));
    expect(states, [false, true, false]);
  });

  testWidgets('an unlock already in flight cannot reopen a locked session', (tester) async {
    final api = _PinApi();
    final status = Completer<({bool isConfigured, DateTime? expiresAt})>();
    when(api.getPinStatus).thenAnswer((_) => status.future);
    final session = PrivateSession(api);
    addTearDown(session.dispose);
    final states = <bool>[];
    session.addListener(states.add);

    final activation = session.activate();
    await session.lock();
    status.complete((isConfigured: true, expiresAt: DateTime.now().add(const Duration(minutes: 15))));

    expect(await activation, isFalse);
    expect(states, [false]);
  });
}
