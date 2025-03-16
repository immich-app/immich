import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/interfaces/user_api.repository.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/domain/services/user.service.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/user.stub.dart';
import '../../infrastructure/repository.mock.dart';
import '../service.mock.dart';

void main() {
  late UserService sut;
  late IUserRepository mockUserRepo;
  late IUserApiRepository mockUserApiRepo;
  late StoreService mockStoreService;

  setUp(() {
    mockUserRepo = MockUserRepository();
    mockUserApiRepo = MockUserApiRepository();
    mockStoreService = MockStoreService();
    sut = UserService(
      userRepository: mockUserRepo,
      userApiRepository: mockUserApiRepo,
      storeService: mockStoreService,
    );
  });

  group('getMyUser', () {
    test('should return user from store', () {
      when(() => mockStoreService.get(StoreKey.currentUser))
          .thenReturn(UserStub.admin);
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
      when(() => mockStoreService.tryGet(StoreKey.currentUser))
          .thenReturn(UserStub.admin);
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
      when(
        () => mockUserApiRepo.createProfileImage(
          name: 'profile.jpg',
          data: Uint8List(0),
        ),
      ).thenAnswer((_) async => 'profile.jpg');

      final result = await sut.createProfileImage('profile.jpg', Uint8List(0));
      expect(result, 'profile.jpg');
    });

    test('should return null if profile image creation fails', () async {
      when(
        () => mockUserApiRepo.createProfileImage(
          name: 'profile.jpg',
          data: Uint8List(0),
        ),
      ).thenThrow(Exception('Failed to create profile image'));

      final result = await sut.createProfileImage('profile.jpg', Uint8List(0));
      expect(result, isNull);
    });
  });
}
