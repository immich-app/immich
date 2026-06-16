import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user_api.repository.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/user.stub.dart';
import '../../infrastructure/repository.mock.dart';

void main() {
  late UserService sut;
  late UserApiRepository mockUserApiRepo;
  late DriftAuthUserRepository mockAuthUserRepo;

  setUp(() {
    mockUserApiRepo = MockUserApiRepository();
    mockAuthUserRepo = MockDriftAuthUserRepository();
    sut = UserService(userApiRepository: mockUserApiRepo, authUserRepository: mockAuthUserRepo);

    registerFallbackValue(UserStub.admin);
    when(() => mockAuthUserRepo.get()).thenAnswer((_) async => UserStub.admin);
    when(() => mockAuthUserRepo.upsert(any())).thenAnswer((_) async => UserStub.admin);
  });

  group('tryGetMyUser', () {
    test('should return the current user from the auth user repository', () async {
      final result = await sut.tryGetMyUser();
      expect(result, UserStub.admin);
    });

    test('should return null if no user is logged in', () async {
      when(() => mockAuthUserRepo.get()).thenAnswer((_) async => null);
      final result = await sut.tryGetMyUser();
      expect(result, isNull);
    });
  });

  group('watchMyUser', () {
    test('should return the current user stream from the auth user repository', () {
      when(() => mockAuthUserRepo.watch()).thenAnswer((_) => Stream.value(UserStub.admin));
      final result = sut.watchMyUser();
      expect(result, emits(UserStub.admin));
    });

    test('should return an empty stream if no user is logged in', () {
      when(() => mockAuthUserRepo.watch()).thenAnswer((_) => const Stream.empty());
      final result = sut.watchMyUser();
      expect(result, emitsInOrder([]));
    });
  });

  group('refreshMyUser', () {
    test('should return user from api and persist it', () async {
      when(() => mockUserApiRepo.getMyUser()).thenAnswer((_) async => UserStub.admin);

      final result = await sut.refreshMyUser();
      verify(() => mockAuthUserRepo.upsert(UserStub.admin)).called(1);
      expect(result, UserStub.admin);
    });

    test('should return null if user not found', () async {
      when(() => mockUserApiRepo.getMyUser()).thenAnswer((_) async => null);

      final result = await sut.refreshMyUser();
      verifyNever(() => mockAuthUserRepo.upsert(any()));
      expect(result, isNull);
    });
  });

  group('createProfileImage', () {
    test('should return profile image path', () async {
      const profileImagePath = 'profile.jpg';

      when(
        () => mockUserApiRepo.createProfileImage(name: profileImagePath, data: Uint8List(0)),
      ).thenAnswer((_) async => profileImagePath);

      final result = await sut.createProfileImage(profileImagePath, Uint8List(0));

      verify(() => mockAuthUserRepo.upsert(UserStub.admin)).called(1);
      expect(result, profileImagePath);
    });

    test('should return null if profile image creation fails', () async {
      const profileImagePath = 'profile.jpg';

      when(
        () => mockUserApiRepo.createProfileImage(name: profileImagePath, data: Uint8List(0)),
      ).thenThrow(Exception('Failed to create profile image'));

      final result = await sut.createProfileImage(profileImagePath, Uint8List(0));
      verifyNever(() => mockAuthUserRepo.upsert(any()));
      expect(result, isNull);
    });
  });
}
