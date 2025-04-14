// ignore_for_file: avoid-unnecessary-futures

import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/interfaces/sync_api.interface.dart';
import 'package:immich_mobile/domain/interfaces/sync_stream.interface.dart';
import 'package:immich_mobile/domain/models/sync_event.model.dart';
import 'package:immich_mobile/domain/services/sync_stream.service.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

import '../../fixtures/sync_stream.stub.dart';
import '../../infrastructure/repository.mock.dart';

void main() {
  late SyncStreamService sut;
  late ISyncStreamRepository mockSyncStreamRepo;
  late ISyncApiRepository mockSyncApiRepo;
  late StreamController<List<SyncEvent>> streamController;

  successHandler(Invocation _) async => true;
  failureHandler(Invocation _) async => false;

  setUp(() {
    mockSyncStreamRepo = MockSyncStreamRepository();
    mockSyncApiRepo = MockSyncApiRepository();
    streamController = StreamController<List<SyncEvent>>.broadcast();

    sut = SyncStreamService(
      syncApiRepository: mockSyncApiRepo,
      syncStreamRepository: mockSyncStreamRepo,
    );

    // Default stream setup - emits one batch and closes
    when(() => mockSyncApiRepo.getSyncEvents(any()))
        .thenAnswer((_) => streamController.stream);

    // Default ack setup
    when(() => mockSyncApiRepo.ack(any())).thenAnswer((_) async => {});

    // Register fallbacks for mocktail verification
    registerFallbackValue(<SyncUserV1>[]);
    registerFallbackValue(<SyncPartnerV1>[]);
    registerFallbackValue(<SyncUserDeleteV1>[]);
    registerFallbackValue(<SyncPartnerDeleteV1>[]);

    // Default successful repository calls
    when(() => mockSyncStreamRepo.updateUsersV1(any()))
        .thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.deleteUsersV1(any()))
        .thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.updatePartnerV1(any()))
        .thenAnswer(successHandler);
    when(() => mockSyncStreamRepo.deletePartnerV1(any()))
        .thenAnswer(successHandler);
  });

  tearDown(() async {
    await streamController.close();
  });

  // Helper to trigger sync and add events to the stream
  Future<void> triggerSyncAndEmit(List<SyncEvent> events) async {
    final future = sut.syncUsers(); // Start listening
    await Future.delayed(Duration.zero); // Allow listener to attach
    if (!streamController.isClosed) {
      streamController.add(events);
      await streamController.close(); // Close after emitting
    }
    await future; // Wait for processing to complete
  }

  group("SyncStreamService", () {
    test(
      "completes successfully when stream emits data and handlers succeed",
      () async {
        final events = [
          ...SyncStreamStub.userEvents,
          ...SyncStreamStub.partnerEvents,
        ];
        final future = triggerSyncAndEmit(events);
        await expectLater(future, completes);
        // Verify ack includes last ack from each successfully handled type
        verify(
          () => mockSyncApiRepo
              .ack(any(that: containsAllInOrder(["5", "2", "4", "3"]))),
        ).called(1);
      },
    );

    test("completes successfully when stream emits an error", () async {
      when(() => mockSyncApiRepo.getSyncEvents(any()))
          .thenAnswer((_) => Stream.error(Exception("Stream Error")));
      // Should complete gracefully without throwing
      await expectLater(sut.syncUsers(), completes);
      verifyNever(() => mockSyncApiRepo.ack(any())); // No ack on stream error
    });

    test("throws when initial getSyncEvents call fails", () async {
      final apiException = Exception("API Error");
      when(() => mockSyncApiRepo.getSyncEvents(any())).thenThrow(apiException);
      // Should rethrow the exception from the initial call
      await expectLater(sut.syncUsers(), throwsA(apiException));
      verifyNever(() => mockSyncApiRepo.ack(any()));
    });

    test(
      "completes successfully when a repository handler throws an exception",
      () async {
        when(() => mockSyncStreamRepo.updateUsersV1(any()))
            .thenThrow(Exception("Repo Error"));
        final events = [
          ...SyncStreamStub.userEvents,
          ...SyncStreamStub.partnerEvents,
        ];
        // Should complete, but ack only for the successful types
        await triggerSyncAndEmit(events);
        // Only partner delete was successful by default setup
        verify(() => mockSyncApiRepo.ack(["2", "4", "3"])).called(1);
      },
    );

    test(
      "completes successfully but sends no ack when all handlers fail",
      () async {
        when(() => mockSyncStreamRepo.updateUsersV1(any()))
            .thenAnswer(failureHandler);
        when(() => mockSyncStreamRepo.deleteUsersV1(any()))
            .thenAnswer(failureHandler);
        when(() => mockSyncStreamRepo.updatePartnerV1(any()))
            .thenAnswer(failureHandler);
        when(() => mockSyncStreamRepo.deletePartnerV1(any()))
            .thenAnswer(failureHandler);

        final events = [
          ...SyncStreamStub.userEvents,
          ...SyncStreamStub.partnerEvents,
        ];
        await triggerSyncAndEmit(events);
        verifyNever(() => mockSyncApiRepo.ack(any()));
      },
    );

    test("sends ack only for types where handler returns true", () async {
      // Mock specific handlers: user update fails, user delete succeeds
      when(() => mockSyncStreamRepo.updateUsersV1(any()))
          .thenAnswer(failureHandler);
      when(() => mockSyncStreamRepo.deleteUsersV1(any()))
          .thenAnswer(successHandler);
      // partner update fails, partner delete succeeds
      when(() => mockSyncStreamRepo.updatePartnerV1(any()))
          .thenAnswer(failureHandler);

      final events = [
        ...SyncStreamStub.userEvents,
        ...SyncStreamStub.partnerEvents,
      ];
      await triggerSyncAndEmit(events);

      // Expect ack only for userDeleteV1 (ack: "2") and partnerDeleteV1 (ack: "4")
      verify(
        () => mockSyncApiRepo.ack(any(that: containsAllInOrder(["2", "4"]))),
      ).called(1);
    });

    test("does not process or ack when stream emits an empty list", () async {
      final future = sut.syncUsers();
      streamController.add([]); // Emit empty list
      await streamController.close();
      await future; // Wait for completion

      verifyNever(() => mockSyncStreamRepo.updateUsersV1(any()));
      verifyNever(() => mockSyncStreamRepo.deleteUsersV1(any()));
      verifyNever(() => mockSyncStreamRepo.updatePartnerV1(any()));
      verifyNever(() => mockSyncStreamRepo.deletePartnerV1(any()));
      verifyNever(() => mockSyncApiRepo.ack(any()));
    });

    test("processes multiple batches sequentially using mutex", () async {
      final completer1 = Completer<void>();
      final completer2 = Completer<void>();
      int callOrder = 0;
      int handler1StartOrder = -1;
      int handler2StartOrder = -1;

      when(() => mockSyncStreamRepo.updateUsersV1(any())).thenAnswer((_) async {
        handler1StartOrder = ++callOrder; // Record when handler 1 starts
        await completer1.future; // Wait for external signal
        return true;
      });
      when(() => mockSyncStreamRepo.updatePartnerV1(any()))
          .thenAnswer((_) async {
        handler2StartOrder = ++callOrder; // Record when handler 2 starts
        await completer2.future;
        return true;
      });

      final batch1 = SyncStreamStub.userEvents;
      final batch2 = SyncStreamStub.partnerEvents;

      final syncFuture = sut.syncUsers();
      streamController.add(batch1); // Emit first batch

      // Ensure first batch processing starts
      await Future.delayed(const Duration(milliseconds: 10));
      expect(handler1StartOrder, 1, reason: "Handler 1 should start first");

      streamController.add(batch2); // Emit second batch while first is waiting

      await Future.delayed(const Duration(milliseconds: 10));
      // Handler 2 should NOT have started yet because mutex is held by handler 1
      expect(
        handler2StartOrder,
        -1,
        reason: "Handler 2 should wait for Handler 1",
      );

      completer1.complete(); // Allow first handler to finish
      // Allow second batch to start processing
      await Future.delayed(const Duration(milliseconds: 10));

      // Now handler 2 should start
      expect(
        handler2StartOrder,
        2,
        reason: "Handler 2 should start after Handler 1 finishes",
      );

      completer2.complete(); // Allow second handler to finish
      await streamController.close(); // Close stream
      await syncFuture; // Wait for overall completion

      // Verify handlers were called and acks sent for both batches eventually
      verify(() => mockSyncStreamRepo.updateUsersV1(any())).called(1);
      verify(() => mockSyncStreamRepo.updatePartnerV1(any())).called(1);
      // Acks might be called separately or combined depending on timing, check count
      verify(() => mockSyncApiRepo.ack(any())).called(2);
    });

    test("completes successfully when ack call throws an exception", () async {
      when(() => mockSyncApiRepo.ack(any())).thenThrow(Exception("Ack Error"));
      final events = [
        ...SyncStreamStub.userEvents,
        ...SyncStreamStub.partnerEvents,
      ];

      // Should still complete even if ack fails
      await triggerSyncAndEmit(events);
      verify(() => mockSyncApiRepo.ack(any()))
          .called(1); // Verify ack was attempted
    });

    test("waits for processing to finish if onDone called early", () async {
      final processingCompleter = Completer<void>();
      bool handlerFinished = false;

      when(() => mockSyncStreamRepo.updateUsersV1(any())).thenAnswer((_) async {
        await processingCompleter.future; // Wait inside handler
        handlerFinished = true;
        return true;
      });

      final syncFuture = sut.syncUsers();
      // Allow listener to attach
      // This is necessary to ensure the stream is ready to receive events
      await Future.delayed(Duration.zero);

      streamController.add(SyncStreamStub.userEvents); // Emit batch
      await Future.delayed(
        const Duration(milliseconds: 10),
      ); // Ensure processing starts

      await streamController
          .close(); // Close stream (triggers onDone internally)
      await Future.delayed(
        const Duration(milliseconds: 10),
      ); // Give onDone a chance to fire

      // At this point, onDone was called, but processing is blocked
      expect(handlerFinished, isFalse);

      processingCompleter.complete(); // Allow processing to finish
      await syncFuture; // Now the main future should complete

      expect(handlerFinished, isTrue);
      verify(() => mockSyncApiRepo.ack(any())).called(1);
    });
  });

  group("syncUsers", () {
    test("calls getSyncEvents with correct types", () async {
      // Need to close the stream for the future to complete
      final future = sut.syncUsers();
      await streamController.close();
      await future;

      verify(
        () => mockSyncApiRepo.getSyncEvents([
          SyncRequestType.usersV1,
          SyncRequestType.partnersV1,
        ]),
      ).called(1);
    });

    test("calls repository methods with correctly grouped data", () async {
      final events = [
        ...SyncStreamStub.userEvents,
        ...SyncStreamStub.partnerEvents,
      ];
      await triggerSyncAndEmit(events);

      // Verify each handler was called with the correct list of data payloads
      verify(
        () => mockSyncStreamRepo.updateUsersV1(
          [SyncStreamStub.userV1Admin, SyncStreamStub.userV1User],
        ),
      ).called(1);
      verify(
        () => mockSyncStreamRepo.deleteUsersV1([SyncStreamStub.userDeleteV1]),
      ).called(1);
      verify(
        () => mockSyncStreamRepo.updatePartnerV1([SyncStreamStub.partnerV1]),
      ).called(1);
      verify(
        () => mockSyncStreamRepo
            .deletePartnerV1([SyncStreamStub.partnerDeleteV1]),
      ).called(1);
    });
  });
}
