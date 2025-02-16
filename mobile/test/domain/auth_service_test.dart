import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/exceptions/auth.exception.dart';
import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/interfaces/user.interface.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/auth.service.dart';
import 'package:mocktail/mocktail.dart';

import '../fixtures/user.stub.dart';
import '../infrastructure/repository.mock.dart';

void main() {
  late AuthService sut;
  late IUserRepository mockUserRepo;
  late IStoreRepository mockStoreRepo;

  setUp(() {
    mockUserRepo = MockUserRepository();
    mockStoreRepo = MockStoreRepository();

    registerFallbackValue(StoreKey.currentUserId);
    registerFallbackValue(UserStub.admin);
  });

  tearDown(() async {
    await sut.cleanup();
  });

  group('AuthService Init:', () {
    test('Loads the offline user on init', () async {
      when(() => mockStoreRepo.tryGet<String>(any()))
          .thenAnswer((_) async => UserStub.admin.id);
      when(() => mockUserRepo.tryGet(any()))
          .thenAnswer((_) async => UserStub.admin);
      sut = AuthService(storeRepo: mockStoreRepo, userRepo: mockUserRepo);
      await pumpEventQueue();

      verify(() => mockStoreRepo.tryGet<String>(StoreKey.currentUserId))
          .called(1);
      verify(() => mockUserRepo.tryGet(any())).called(1);
      expect(sut.tryGetUser(), UserStub.admin);
    });

    test('Null current user when no user is stored', () {
      when(() => mockStoreRepo.tryGet<String>(any()))
          .thenAnswer((_) async => null);
      sut = AuthService(storeRepo: mockStoreRepo, userRepo: mockUserRepo);

      expect(sut.tryGetUser(), isNull);
      verifyNever(() => mockUserRepo.tryGet(any()));
    });
  });

  group('AuthService Get:', () {
    test('Throws UserNotLoggedInException when user is unavailable', () {
      when(() => mockStoreRepo.tryGet<String>(any()))
          .thenAnswer((_) async => null);
      sut = AuthService(storeRepo: mockStoreRepo, userRepo: mockUserRepo);
      expect(() => sut.getUser(), throwsA(isA<UserNotLoggedInException>()));
    });

    test('Returns the current user', () async {
      when(() => mockStoreRepo.tryGet<String>(any()))
          .thenAnswer((_) async => UserStub.admin.id);
      when(() => mockUserRepo.tryGet(any()))
          .thenAnswer((_) async => UserStub.admin);

      sut = AuthService(storeRepo: mockStoreRepo, userRepo: mockUserRepo);
      await pumpEventQueue();
      expect(sut.getUser(), UserStub.admin);
    });
  });

  group('AuthService Try Get:', () {
    test('Returns null when user is unavailable', () {
      when(() => mockStoreRepo.tryGet<String>(any()))
          .thenAnswer((_) async => null);
      sut = AuthService(storeRepo: mockStoreRepo, userRepo: mockUserRepo);
      expect(sut.tryGetUser(), isNull);
    });

    test('Returns the current user', () async {
      when(() => mockStoreRepo.tryGet<String>(any()))
          .thenAnswer((_) async => UserStub.admin.id);
      when(() => mockUserRepo.tryGet(any()))
          .thenAnswer((_) async => UserStub.admin);

      sut = AuthService(storeRepo: mockStoreRepo, userRepo: mockUserRepo);
      await pumpEventQueue();
      expect(sut.tryGetUser(), UserStub.admin);
    });
  });

  group('AuthService Update:', () {
    setUp(() {
      when(() => mockUserRepo.update(any()))
          .thenAnswer((_) async => UserStub.admin);
      when(() => mockStoreRepo.update<String>(any(), any()))
          .thenAnswer((_) async => true);
    });

    test('Updates the user and internal cache', () async {
      when(() => mockStoreRepo.tryGet<String>(any()))
          .thenAnswer((_) async => null);
      sut = AuthService(storeRepo: mockStoreRepo, userRepo: mockUserRepo);

      await sut.updateUser(UserStub.admin);
      expect(sut.tryGetUser(), UserStub.admin);
      verify(() => mockUserRepo.update(UserStub.admin)).called(1);
      verify(() =>
              mockStoreRepo.update(StoreKey.currentUserId, UserStub.admin.id))
          .called(1);
    });

    test('Notifies listeners', () async {
      when(() => mockStoreRepo.tryGet<String>(any()))
          .thenAnswer((_) async => null);
      sut = AuthService(storeRepo: mockStoreRepo, userRepo: mockUserRepo);
      final stream = sut.watchUser();
      expectLater(stream, emits(UserStub.admin));
      await sut.updateUser(UserStub.admin);
    });
  });
}
