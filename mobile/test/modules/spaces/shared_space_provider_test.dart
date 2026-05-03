import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/user.model.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/pages/library/spaces/space_member_selection.page.dart';
import 'package:immich_mobile/providers/infrastructure/user.provider.dart';
import 'package:immich_mobile/providers/shared_space.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/repositories/shared_space_api.repository.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart' as api;

import '../../infrastructure/repository.mock.dart';

class MockSharedSpaceApiRepository extends Mock implements SharedSpaceApiRepository {}

/// Test-local stand-in for the real [CurrentUserProvider]. Lets us seed a
/// user (or null) without wiring up a full UserService.
class MockCurrentUserProvider extends CurrentUserProvider with Mock {
  MockCurrentUserProvider([UserDto? initial]) : super(_makeNoopUserService()) {
    state = initial;
  }
}

class _NoopUserService extends Mock implements UserService {}

UserService _makeNoopUserService() {
  final svc = _NoopUserService();
  // CurrentUserProvider's constructor calls tryGetMyUser() and watchMyUser();
  // mocktail returns null for unstubbed methods which crashes on the
  // non-nullable `Stream<UserDto?>` return type.
  when(() => svc.tryGetMyUser()).thenReturn(null);
  when(() => svc.watchMyUser()).thenAnswer((_) => const Stream<UserDto?>.empty());
  return svc;
}

ProviderContainer _container({required List<Override> overrides}) {
  final container = ProviderContainer(overrides: overrides);
  addTearDown(container.dispose);
  return container;
}

void main() {
  late MockSharedSpaceApiRepository mockRepo;

  setUp(() {
    mockRepo = MockSharedSpaceApiRepository();
  });

  group('sharedSpacesProvider', () {
    test('returns list of spaces from repository', () async {
      final spaces = <api.SharedSpaceResponseDto>[
        api.SharedSpaceResponseDto(
          id: 'space-1',
          name: 'Family Photos',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdById: 'user-1',
        ),
        api.SharedSpaceResponseDto(
          id: 'space-2',
          name: 'Work',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          createdById: 'user-1',
        ),
      ];
      when(() => mockRepo.getAll()).thenAnswer((_) async => spaces);

      final container = _container(
        overrides: [
          sharedSpaceApiRepositoryProvider.overrideWithValue(mockRepo),
          currentUserProvider.overrideWith((ref) => MockCurrentUserProvider()),
        ],
      );

      final result = await container.read(sharedSpacesProvider.future);

      expect(result.length, equals(2));
      expect(result[0].name, equals('Family Photos'));
      expect(result[1].name, equals('Work'));
    });

    test('propagates errors from repository', () async {
      when(() => mockRepo.getAll()).thenThrow(Exception('Network error'));

      final container = _container(
        overrides: [
          sharedSpaceApiRepositoryProvider.overrideWithValue(mockRepo),
          currentUserProvider.overrideWith((ref) => MockCurrentUserProvider()),
        ],
      );

      expect(() => container.read(sharedSpacesProvider.future), throwsA(isA<Exception>()));
    });
  });

  group('sharedSpaceProvider', () {
    test('returns single space by id', () async {
      final space = api.SharedSpaceResponseDto(
        id: 'space-1',
        name: 'Family Photos',
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
        createdById: 'user-1',
      );
      when(() => mockRepo.get('space-1')).thenAnswer((_) async => space);

      final container = _container(overrides: [sharedSpaceApiRepositoryProvider.overrideWithValue(mockRepo)]);

      final result = await container.read(sharedSpaceProvider('space-1').future);

      expect(result.id, equals('space-1'));
      expect(result.name, equals('Family Photos'));
    });
  });

  group('sharedSpaceMembersProvider', () {
    test('returns members for a space', () async {
      final members = <api.SharedSpaceMemberResponseDto>[
        api.SharedSpaceMemberResponseDto(
          userId: 'user-1',
          name: 'Alice',
          email: 'alice@test.com',
          role: api.SharedSpaceRole.owner,
          joinedAt: '2024-01-01T00:00:00Z',
          sharePersonMetadata: true,
          showInTimeline: true,
        ),
        api.SharedSpaceMemberResponseDto(
          userId: 'user-2',
          name: 'Bob',
          email: 'bob@test.com',
          role: api.SharedSpaceRole.viewer,
          joinedAt: '2024-01-01T00:00:00Z',
          sharePersonMetadata: true,
          showInTimeline: true,
        ),
      ];
      when(() => mockRepo.getMembers('space-1')).thenAnswer((_) async => members);

      final container = _container(overrides: [sharedSpaceApiRepositoryProvider.overrideWithValue(mockRepo)]);

      final result = await container.read(sharedSpaceMembersProvider('space-1').future);

      expect(result.length, equals(2));
      expect(result[0].role, equals(api.SharedSpaceRole.owner));
      expect(result[1].role, equals(api.SharedSpaceRole.viewer));
    });
  });

  group('sharedSpacesProvider refresh', () {
    test('refetches data after invalidation', () async {
      final initialSpaces = <api.SharedSpaceResponseDto>[
        api.SharedSpaceResponseDto(
          id: 'space-1',
          name: 'Initial',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdById: 'user-1',
        ),
      ];
      final updatedSpaces = <api.SharedSpaceResponseDto>[
        api.SharedSpaceResponseDto(
          id: 'space-1',
          name: 'Initial',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
          createdById: 'user-1',
        ),
        api.SharedSpaceResponseDto(
          id: 'space-2',
          name: 'New Space',
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
          createdById: 'user-1',
        ),
      ];

      var callCount = 0;
      when(() => mockRepo.getAll()).thenAnswer((_) async {
        callCount++;
        return callCount == 1 ? initialSpaces : updatedSpaces;
      });

      final container = _container(
        overrides: [
          sharedSpaceApiRepositoryProvider.overrideWithValue(mockRepo),
          currentUserProvider.overrideWith((ref) => MockCurrentUserProvider()),
        ],
      );

      // First fetch
      final result1 = await container.read(sharedSpacesProvider.future);
      expect(result1.length, equals(1));

      // Invalidate (simulates pull-to-refresh)
      container.invalidate(sharedSpacesProvider);

      // Second fetch returns updated data
      final result2 = await container.read(sharedSpacesProvider.future);
      expect(result2.length, equals(2));
      expect(result2[1].name, equals('New Space'));
      verify(() => mockRepo.getAll()).called(2);
    });
  });

  group('spaceMemberCandidatesProvider', () {
    test('fetches users from API and excludes current user', () async {
      final mockUserApiRepo = MockUserApiRepository();
      final mockCurrentUser = MockCurrentUserProvider(
        UserDto(id: 'user-1', name: 'Alice', email: 'alice@test.com', isAdmin: false, profileChangedAt: DateTime(2024)),
      );

      final allUsers = [
        UserDto(id: 'user-1', name: 'Alice', email: 'alice@test.com', isAdmin: false, profileChangedAt: DateTime(2024)),
        UserDto(id: 'user-2', name: 'Bob', email: 'bob@test.com', isAdmin: false, profileChangedAt: DateTime(2024)),
        UserDto(
          id: 'user-3',
          name: 'Charlie',
          email: 'charlie@test.com',
          isAdmin: false,
          profileChangedAt: DateTime(2024),
        ),
      ];
      when(() => mockUserApiRepo.getAll()).thenAnswer((_) async => List.from(allUsers));

      final container = _container(
        overrides: [
          userApiRepositoryProvider.overrideWithValue(mockUserApiRepo),
          currentUserProvider.overrideWith((ref) => mockCurrentUser),
        ],
      );

      final result = await container.read(spaceMemberCandidatesProvider.future);

      expect(result.length, equals(2));
      expect(result.any((u) => u.id == 'user-1'), isFalse);
      expect(result.any((u) => u.id == 'user-2'), isTrue);
      expect(result.any((u) => u.id == 'user-3'), isTrue);
    });

    test('returns all users when no current user', () async {
      final mockUserApiRepo = MockUserApiRepository();

      final allUsers = [
        UserDto(id: 'user-1', name: 'Alice', email: 'alice@test.com', isAdmin: false, profileChangedAt: DateTime(2024)),
        UserDto(id: 'user-2', name: 'Bob', email: 'bob@test.com', isAdmin: false, profileChangedAt: DateTime(2024)),
      ];
      when(() => mockUserApiRepo.getAll()).thenAnswer((_) async => List.from(allUsers));

      final container = _container(
        overrides: [
          userApiRepositoryProvider.overrideWithValue(mockUserApiRepo),
          currentUserProvider.overrideWith((ref) => MockCurrentUserProvider()),
        ],
      );

      final result = await container.read(spaceMemberCandidatesProvider.future);

      expect(result.length, equals(2));
    });
  });
}
