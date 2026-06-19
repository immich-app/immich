import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/memory.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:mocktail/mocktail.dart';

class MockDriftMemoryService extends Mock implements DriftMemoryService {}

class MockUserService extends Mock implements UserService {}

void main() {
  late MockDriftMemoryService memoryService;
  late MockUserService userService;

  UserDto user({bool memoryEnabled = true}) => UserDto(
    id: 'user-1',
    email: 'user@test.dev',
    name: 'user',
    memoryEnabled: memoryEnabled,
    profileChangedAt: DateTime(2026),
  );

  ProviderContainer makeContainer() {
    final container = ProviderContainer(
      overrides: [
        driftMemoryServiceProvider.overrideWithValue(memoryService),
        currentUserProvider.overrideWith((ref) => CurrentUserProvider(userService)),
      ],
    );
    addTearDown(container.dispose);
    return container;
  }

  setUp(() {
    memoryService = MockDriftMemoryService();
    userService = MockUserService();

    when(() => memoryService.getMemoryLane('user-1')).thenAnswer((_) async => []);
    when(() => userService.tryGetMyUser()).thenReturn(user());
    when(() => userService.watchMyUser()).thenAnswer((_) => const Stream.empty());
  });

  group('driftMemoryFutureProvider', () {
    test('re-queries after local midnight', () {
      fakeAsync((async) {
        final container = makeContainer();
        container.listen(driftMemoryFutureProvider, (_, __) {});
        async.flushMicrotasks();

        verify(() => memoryService.getMemoryLane('user-1')).called(1);

        async.elapse(const Duration(seconds: 4));
        async.flushMicrotasks();
        verifyNever(() => memoryService.getMemoryLane('user-1'));

        async.elapse(const Duration(hours: 25));
        async.flushMicrotasks();
        verify(() => memoryService.getMemoryLane('user-1')).called(greaterThanOrEqualTo(1));
      });
    });

    test('cancels the midnight timer when disposed', () {
      fakeAsync((async) {
        final container = makeContainer();
        final subscription = container.listen(driftMemoryFutureProvider, (_, __) {});
        async.flushMicrotasks();
        verify(() => memoryService.getMemoryLane('user-1')).called(1);

        subscription.close();
        async.elapse(const Duration(hours: 25));
        async.flushMicrotasks();

        verifyNever(() => memoryService.getMemoryLane('user-1'));
      });
    });

    test('does not query or arm the timer when memories are disabled', () {
      when(() => userService.tryGetMyUser()).thenReturn(user(memoryEnabled: false));

      fakeAsync((async) {
        final container = makeContainer();
        container.listen(driftMemoryFutureProvider, (_, __) {});
        async.flushMicrotasks();

        async.elapse(const Duration(hours: 25));
        async.flushMicrotasks();

        verifyNever(() => memoryService.getMemoryLane(any()));
      });
    });
  });
}
