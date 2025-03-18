import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/sync_stream.interface.dart';
import 'package:immich_mobile/domain/services/sync_stream.service.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

import '../../fixtures/sync_stream.stub.dart';
import '../../infrastructure/repository.mock.dart';

void main() {
  late SyncStreamService sut;
  late ISyncStreamRepository mockSyncStreamRepo;
  late ISyncApiRepository mockSyncApiRepo;

  setUp(() {
    mockSyncStreamRepo = MockSyncStreamRepository();
    mockSyncApiRepo = MockSyncApiRepository();
    sut = SyncStreamService(
      syncApiRepository: mockSyncApiRepo,
      syncStreamRepository: mockSyncStreamRepo,
    );

    when(() => mockSyncApiRepo.getSyncEvents([SyncRequestType.usersV1]))
        .thenAnswer((_) => Stream.value(SyncStreamStub.userEvents));
    when(() => mockSyncApiRepo.getSyncEvents([SyncRequestType.partnersV1]))
        .thenAnswer((_) => Stream.value(SyncStreamStub.partnerEvents));
    when(() => mockSyncApiRepo.ack(any())).thenAnswer((_) => Future.value());

    registerFallbackValue(SyncStreamStub.userV1Admin);
    when(() => mockSyncStreamRepo.updateUsersV1(any()))
        .thenAnswer((_) => Future.value(true));
    registerFallbackValue(SyncStreamStub.partnerV1);
    when(() => mockSyncStreamRepo.updatePartnerV1(any()))
        .thenAnswer((_) => Future.value(false));
    registerFallbackValue(SyncStreamStub.userDeleteV1);
    when(() => mockSyncStreamRepo.deleteUsersV1(any()))
        .thenAnswer((_) => Future.value(false));
    registerFallbackValue(SyncStreamStub.partnerDeleteV1);
    when(() => mockSyncStreamRepo.deletePartnerV1(any()))
        .thenAnswer((_) => Future.value(true));
  });

  group("_syncEvent", () {
    test("future completed on success", () async {
      await expectLater(sut.syncUsers(), completes);
    });

    test("future completes on error from stream", () async {
      when(() => mockSyncApiRepo.getSyncEvents([SyncRequestType.usersV1]))
          .thenAnswer((_) => Stream.error(Exception("Error")));
      await expectLater(sut.syncUsers(), completes);
    });

    test("future throws on api exception", () {
      when(() => mockSyncApiRepo.getSyncEvents([SyncRequestType.usersV1]))
          .thenThrow(Exception("Error"));
      expect(sut.syncUsers(), throwsA(isA<Exception>()));
    });

    test("future completes on repository exception", () {
      when(() => mockSyncStreamRepo.updateUsersV1(any()))
          .thenThrow(Exception("Error"));
      expect(sut.syncUsers(), completes);
    });

    test("sends ack for successful events", () async {
      when(() => mockSyncStreamRepo.updateUsersV1(any()))
          .thenAnswer((_) => Future.value(false));
      when(() => mockSyncStreamRepo.deleteUsersV1(any()))
          .thenAnswer((_) => Future.value(true));
      await sut.syncUsers();
      verify(() => mockSyncApiRepo.ack(["2"])).called(1);
    });

    test("only sends the latest ack for events of same type", () async {
      await sut.syncUsers();
      verify(() => mockSyncApiRepo.ack(["5"])).called(1);
    });
  });

  group("syncUsers", () {
    test("calls _syncEvent with usersV1", () async {
      await sut.syncUsers();
      verify(() => mockSyncApiRepo.getSyncEvents([SyncRequestType.usersV1]))
          .called(1);
    });

    test("calls _handleSyncData for each event", () async {
      await sut.syncUsers();
      verify(() => mockSyncStreamRepo.updateUsersV1(SyncStreamStub.userV1Admin))
          .called(1);
      verify(
        () => mockSyncStreamRepo.deleteUsersV1(SyncStreamStub.userDeleteV1),
      ).called(1);
    });
  });

  group("syncPartners", () {
    test("calls _syncEvent with partnersV1", () async {
      await sut.syncPartners();
      verify(() => mockSyncApiRepo.getSyncEvents([SyncRequestType.partnersV1]))
          .called(1);
    });

    test("calls _handleSyncData for each event", () async {
      await sut.syncPartners();
      verify(
        () => mockSyncStreamRepo.updatePartnerV1(SyncStreamStub.partnerV1),
      ).called(1);
      verify(
        () =>
            mockSyncStreamRepo.deletePartnerV1(SyncStreamStub.partnerDeleteV1),
      ).called(1);
    });
  });
}
