import 'package:fake_async/fake_async.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/infrastructure/repositories/memory.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../infrastructure/repository.mock.dart';

class MockUserService extends Mock implements UserService {}

void main() {
  late MockMemoryRepository memoryRepository;
  late MockUserService userService;

  UserDto user({bool memoryEnabled = true}) => UserDto(
    id: 'user-1',
    email: 'user@test.dev',
    name: 'user',
    memoryEnabled: memoryEnabled,
    profileChangedAt: DateTime(2026),
  );

  Drift mockDrift(MemoryRepository repository) {
    final drift = MockDrift();
    when(() => drift.memoryRepository).thenReturn(repository);
    return drift;
  }

  ProviderContainer makeContainer() {
    final container = ProviderContainer(
      overrides: [
        driftProvider.overrideWithValue(mockDrift(memoryRepository)),
        currentUserProvider.overrideWith((ref) => CurrentUserProvider(userService)),
      ],
    );
    addTearDown(container.dispose);
    return container;
  }

  setUp(() {
    memoryRepository = MockMemoryRepository();
    userService = MockUserService();

    when(() => memoryRepository.getAll('user-1')).thenAnswer((_) async => []);
    when(() => userService.tryGetMyUser()).thenReturn(user());
    when(() => userService.watchMyUser()).thenAnswer((_) => const Stream.empty());
  });

  group('driftMemoryLaneProvider', () {
    test('re-queries after local midnight', () {
      fakeAsync((async) {
        final container = makeContainer();
        container.listen(driftMemoryLaneProvider, (_, _) {});
        async.flushMicrotasks();

        verify(() => memoryRepository.getAll('user-1')).called(1);

        async.elapse(const Duration(seconds: 4));
        async.flushMicrotasks();
        verifyNever(() => memoryRepository.getAll('user-1'));

        async.elapse(const Duration(hours: 25));
        async.flushMicrotasks();
        verify(() => memoryRepository.getAll('user-1')).called(greaterThanOrEqualTo(1));
      });
    });

    test('cancels the midnight timer when disposed', () {
      fakeAsync((async) {
        final container = makeContainer();
        final subscription = container.listen(driftMemoryLaneProvider, (_, _) {});
        async.flushMicrotasks();
        verify(() => memoryRepository.getAll('user-1')).called(1);

        subscription.close();
        async.elapse(const Duration(hours: 25));
        async.flushMicrotasks();

        verifyNever(() => memoryRepository.getAll('user-1'));
      });
    });

    test('does not query or arm the timer when memories are disabled', () {
      when(() => userService.tryGetMyUser()).thenReturn(user(memoryEnabled: false));

      fakeAsync((async) {
        final container = makeContainer();
        container.listen(driftMemoryLaneProvider, (_, _) {});
        async.flushMicrotasks();

        async.elapse(const Duration(hours: 25));
        async.flushMicrotasks();

        verifyNever(() => memoryRepository.getAll(any()));
      });
    });
  });
}
