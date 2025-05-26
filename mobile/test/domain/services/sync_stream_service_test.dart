// ignore_for_file: avoid-declaring-call-method, avoid-unnecessary-futures

import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/sync_stream.interface.dart';
import 'package:immich_mobile/domain/models/sync_event.model.dart';
import 'package:immich_mobile/domain/services/sync_stream.service.dart';
import 'package:mocktail/mocktail.dart';

import '../../fixtures/sync_stream.stub.dart';
import '../../infrastructure/repository.mock.dart';

class _AbortCallbackWrapper {
  const _AbortCallbackWrapper();

  bool call() => false;
}

class _MockAbortCallbackWrapper extends Mock implements _AbortCallbackWrapper {}

class _CancellationWrapper {
  const _CancellationWrapper();

  bool call() => false;
}

class _MockCancellationWrapper extends Mock implements _CancellationWrapper {}

void main() {
  late SyncStreamService sut;
  late ISyncStreamRepository mockSyncStreamRepo;
  late ISyncApiRepository mockSyncApiRepo;
  late Function(List<SyncEvent>, Function()) handleEventsCallback;
  late _MockAbortCallbackWrapper mockAbortCallbackWrapper;

  successHandler(Invocation _) async => true;

  setUp(() {
    mockSyncStreamRepo = MockSyncStreamRepository();
    mockSyncApiRepo = MockSyncApiRepository();
    mockAbortCallbackWrapper = _MockAbortCallbackWrapper();

    when(() => mockAbortCallbackWrapper()).thenReturn(false);

    when(() => mockSyncApiRepo.streamChanges(any()))
        .thenAnswer((invocation) async {
      // ignore: avoid-unsafe-collection-methods
      handleEventsCallback = invocation.positionalArguments.first;
    });

    when(() => mockSyncApiRepo.ack(any())).thenAnswer((_) async => {});

    when(() => mockSyncStreamRepo.updateUsersV1(any()))
        .thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.deleteUsersV1(any()))
        .thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.updatePartnerV1(any()))
        .thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.deletePartnerV1(any()))
        .thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.updateAssetsV1(any()))
        .thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.deleteAssetsV1(any()))
        .thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.updateAssetsExifV1(any()))
        .thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.updatePartnerAssetsV1(any()))
        .thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.deletePartnerAssetsV1(any()))
        .thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.updatePartnerAssetsExifV1(any()))
        .thenAnswer(successHandler);

    sut = SyncStreamService(
      syncApiRepository: mockSyncApiRepo,
      syncStreamRepository: mockSyncStreamRepo,
    );
  });

  Future<void> simulateEvents(List<SyncEvent> events) async {
    await sut.sync();
    await handleEventsCallback(events, mockAbortCallbackWrapper.call);
  }

  group("SyncStreamService - _handleEvents", () {
    test(
      "processes events and acks successfully when handlers succeed",
      () async {
        final events = [
          SyncStreamStub.userDeleteV1,
          SyncStreamStub.userV1Admin,
          SyncStreamStub.userV1User,
          SyncStreamStub.partnerDeleteV1,
          SyncStreamStub.partnerV1,
        ];

        await simulateEvents(events);

        verifyInOrder([
          () => mockSyncStreamRepo.deleteUsersV1(any()),
          () => mockSyncApiRepo.ack(["2"]),
          () => mockSyncStreamRepo.updateUsersV1(any()),
          () => mockSyncApiRepo.ack(["5"]),
          () => mockSyncStreamRepo.deletePartnerV1(any()),
          () => mockSyncApiRepo.ack(["4"]),
          () => mockSyncStreamRepo.updatePartnerV1(any()),
          () => mockSyncApiRepo.ack(["3"]),
        ]);
        verifyNever(() => mockAbortCallbackWrapper());
      },
    );

    test("processes final batch correctly", () async {
      final events = [
        SyncStreamStub.userDeleteV1,
        SyncStreamStub.userV1Admin,
      ];

      await simulateEvents(events);

      verifyInOrder([
        () => mockSyncStreamRepo.deleteUsersV1(any()),
        () => mockSyncApiRepo.ack(["2"]),
        () => mockSyncStreamRepo.updateUsersV1(any()),
        () => mockSyncApiRepo.ack(["1"]),
      ]);
      verifyNever(() => mockAbortCallbackWrapper());
    });

    test("does not process or ack when event list is empty", () async {
      await simulateEvents([]);

      verifyNever(() => mockSyncStreamRepo.updateUsersV1(any()));
      verifyNever(() => mockSyncStreamRepo.deleteUsersV1(any()));
      verifyNever(() => mockSyncStreamRepo.updatePartnerV1(any()));
      verifyNever(() => mockSyncStreamRepo.deletePartnerV1(any()));
      verifyNever(() => mockAbortCallbackWrapper());
      verifyNever(() => mockSyncApiRepo.ack(any()));
    });

    test("aborts and stops processing if cancelled during iteration", () async {
      final cancellationChecker = _MockCancellationWrapper();
      when(() => cancellationChecker()).thenReturn(false);

      sut = SyncStreamService(
        syncApiRepository: mockSyncApiRepo,
        syncStreamRepository: mockSyncStreamRepo,
        cancelChecker: cancellationChecker.call,
      );
      await sut.sync();

      final events = [
        SyncStreamStub.userDeleteV1,
        SyncStreamStub.userV1Admin,
        SyncStreamStub.partnerDeleteV1,
      ];

      when(() => mockSyncStreamRepo.deleteUsersV1(any())).thenAnswer((_) async {
        when(() => cancellationChecker()).thenReturn(true);
      });

      await handleEventsCallback(events, mockAbortCallbackWrapper.call);

      verify(() => mockSyncStreamRepo.deleteUsersV1(any())).called(1);
      verifyNever(() => mockSyncStreamRepo.updateUsersV1(any()));
      verifyNever(() => mockSyncStreamRepo.deletePartnerV1(any()));

      verify(() => mockAbortCallbackWrapper()).called(1);

      verify(() => mockSyncApiRepo.ack(["2"])).called(1);
    });

    test(
      "aborts and stops processing if cancelled before processing batch",
      () async {
        final cancellationChecker = _MockCancellationWrapper();
        when(() => cancellationChecker()).thenReturn(false);

        final processingCompleter = Completer<void>();
        bool handler1Started = false;
        when(() => mockSyncStreamRepo.deleteUsersV1(any()))
            .thenAnswer((_) async {
          handler1Started = true;
          return processingCompleter.future;
        });

        sut = SyncStreamService(
          syncApiRepository: mockSyncApiRepo,
          syncStreamRepository: mockSyncStreamRepo,
          cancelChecker: cancellationChecker.call,
        );

        await sut.sync();

        final events = [
          SyncStreamStub.userDeleteV1,
          SyncStreamStub.userV1Admin,
          SyncStreamStub.partnerDeleteV1,
        ];

        final processingFuture =
            handleEventsCallback(events, mockAbortCallbackWrapper.call);
        await pumpEventQueue();

        expect(handler1Started, isTrue);

        // Signal cancellation while handler 1 is waiting
        when(() => cancellationChecker()).thenReturn(true);
        await pumpEventQueue();

        processingCompleter.complete();
        await processingFuture;

        verifyNever(() => mockSyncStreamRepo.updateUsersV1(any()));

        verify(() => mockSyncApiRepo.ack(["2"])).called(1);
      },
    );
  });
}
