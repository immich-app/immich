import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:immich_mobile/infrastructure/repositories/user.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/user_api.repository.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/user.stub.dart';
import '../../infrastructure/repository.mock.dart';
import '../service.mock.dart';

void main() {
  late UserService sut;
  late IsarUserRepository mockUserRepo;
  late UserApiRepository mockUserApiRepo;
  late StoreService mockStoreService;

  setUp(() {
    mockUserRepo = MockIsarUserRepository();
    mockUserApiRepo = MockUserApiRepository();
    mockStoreService = MockStoreService();
    sut = UserService(
      isarUserRepository: mockUserRepo,
      userApiRepository: mockUserApiRepo,
      storeService: mockStoreService,
    );

    registerFallbackValue(UserStub.admin);
    when(() => mockStoreService.get(StoreKey.currentUser))
        .thenReturn(UserStub.admin);
    when(() => mockStoreService.tryGet(StoreKey.currentUser))
        .thenReturn(UserStub.admin);
  });

  group('getMyUser', () {
    test('should return user from store', () {
      final result = sut.getMyUser();
      expect(result, UserStub.admin);
    });

    test('should handle user not found scenario', () {
      when(() => mockStoreService.get(StoreKey.currentUser))
          .thenThrow(Exception('User not found'));

      expect(() => sut.getMyUser(), throwsA(isA<Exception>()));
    });
  });

  group('tryGetMyUser', () {
    test('should return user from store', () {
      final result = sut.tryGetMyUser();
      expect(result, UserStub.admin);
    });

    test('should return null if user not found', () {
      when(() => mockStoreService.tryGet(StoreKey.currentUser))
          .thenReturn(null);
      final result = sut.tryGetMyUser();
      expect(result, isNull);
    });
  });

  group('watchMyUser', () {
    test('should return user stream from store', () {
      when(() => mockStoreService.watch(StoreKey.currentUser))
          .thenAnswer((_) => Stream.value(UserStub.admin));
      final result = sut.watchMyUser();
      expect(result, emits(UserStub.admin));
    });

    test('should return an empty stream if user not found', () {
      when(() => mockStoreService.watch(StoreKey.currentUser))
          .thenAnswer((_) => const Stream.empty());
      final result = sut.watchMyUser();
      expect(result, emitsInOrder([]));
    });
  });

  group('refreshMyUser', () {
    test('should return user from api and store it', () async {
      when(() => mockUserApiRepo.getMyUser())
          .thenAnswer((_) async => UserStub.admin);
      when(() => mockStoreService.put(StoreKey.currentUser, UserStub.admin))
          .thenAnswer((_) async => true);
      when(() => mockUserRepo.update(UserStub.admin))
          .thenAnswer((_) async => UserStub.admin);

      final result = await sut.refreshMyUser();
      verify(() => mockStoreService.put(StoreKey.currentUser, UserStub.admin))
          .called(1);
      verify(() => mockUserRepo.update(UserStub.admin)).called(1);
      expect(result, UserStub.admin);
    });

    test('should return null if user not found', () async {
      when(() => mockUserApiRepo.getMyUser()).thenAnswer((_) async => null);

      final result = await sut.refreshMyUser();
      verifyNever(
        () => mockStoreService.put(StoreKey.currentUser, UserStub.admin),
      );
      verifyNever(() => mockUserRepo.update(UserStub.admin));
      expect(result, isNull);
    });
  });

  group('createProfileImage', () {
    test('should return profile image path', () async {
      const profileImagePath = 'profile.jpg';
      final updatedUser =
          UserStub.admin.copyWith(profileImagePath: profileImagePath);

      when(
        () => mockUserApiRepo.createProfileImage(
          name: profileImagePath,
          data: Uint8List(0),
        ),
      ).thenAnswer((_) async => profileImagePath);
      when(() => mockStoreService.put(StoreKey.currentUser, updatedUser))
          .thenAnswer((_) async => true);
      when(() => mockUserRepo.update(updatedUser))
          .thenAnswer((_) async => UserStub.admin);

      final result =
          await sut.createProfileImage(profileImagePath, Uint8List(0));

      verify(() => mockStoreService.put(StoreKey.currentUser, updatedUser))
          .called(1);
      verify(() => mockUserRepo.update(updatedUser)).called(1);
      expect(result, profileImagePath);
    });

    test('should return null if profile image creation fails', () async {
      const profileImagePath = 'profile.jpg';
      final updatedUser =
          UserStub.admin.copyWith(profileImagePath: profileImagePath);

      when(
        () => mockUserApiRepo.createProfileImage(
          name: profileImagePath,
          data: Uint8List(0),
        ),
      ).thenThrow(Exception('Failed to create profile image'));

      final result =
          await sut.createProfileImage(profileImagePath, Uint8List(0));
      verifyNever(
        () => mockStoreService.put(StoreKey.currentUser, updatedUser),
      );
      verifyNever(() => mockUserRepo.update(updatedUser));
      expect(result, isNull);
    });
  });
}
