import 'dart:async';
import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:immich_mobile/domain/models/sync_event.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/sync_api.repository.dart';
import 'package:immich_mobile/utils/semver.dart';
import 'package:mocktail/mocktail.dart';
import 'package:openapi/api.dart';

import '../../api.mocks.dart';
import '../../service.mocks.dart';
import '../../test_utils.dart';

class MockHttpClient extends Mock implements http.Client {}

class MockApiClient extends Mock implements ApiClient {}

class MockStreamedResponse extends Mock implements http.StreamedResponse {}

class FakeBaseRequest extends Fake implements http.BaseRequest {}

String _createJsonLine(String type, Map<String, dynamic> data, String ack) {
  return '${jsonEncode({'type': type, 'data': data, 'ack': ack})}\n';
}

void main() {
  late SyncApiRepository sut;
  late MockApiService mockApiService;
  late MockApiClient mockApiClient;
  late MockSyncApi mockSyncApi;
  late MockHttpClient mockHttpClient;
  late MockStreamedResponse mockStreamedResponse;
  late StreamController<List<int>> responseStreamController;
  late int testBatchSize = 3;

  setUpAll(() async {
    await StoreService.init(storeRepository: IsarStoreRepository(await TestUtils.initIsar()));
  });

  setUp(() {
    mockApiService = MockApiService();
    mockApiClient = MockApiClient();
    mockSyncApi = MockSyncApi();
    mockHttpClient = MockHttpClient();
    mockStreamedResponse = MockStreamedResponse();
    responseStreamController = StreamController<List<int>>.broadcast(sync: true);

    registerFallbackValue(FakeBaseRequest());

    when(() => mockApiService.apiClient).thenReturn(mockApiClient);
    when(() => mockApiService.syncApi).thenReturn(mockSyncApi);
    when(() => mockApiClient.basePath).thenReturn('http://demo.immich.app/api');
    when(() => mockApiService.applyToParams(any(), any())).thenAnswer((_) async => {});

    // Mock HTTP client behavior
    when(() => mockHttpClient.send(any())).thenAnswer((_) async => mockStreamedResponse);
    when(() => mockStreamedResponse.statusCode).thenReturn(200);
    when(() => mockStreamedResponse.stream).thenAnswer((_) => http.ByteStream(responseStreamController.stream));
    when(() => mockHttpClient.close()).thenAnswer((_) => {});

    sut = SyncApiRepository(mockApiService);
  });

  tearDown(() async {
    if (!responseStreamController.isClosed) {
      await responseStreamController.close();
    }
  });

  Future<void> streamChanges(
    Future<void> Function(List<SyncEvent>, Function() abort, Function() reset) onDataCallback,
    SemVer serverVersion,
  ) {
    return sut.streamChanges(
      onDataCallback,
      batchSize: testBatchSize,
      httpClient: mockHttpClient,
      serverVersion: serverVersion,
    );
  }

  test('streamChanges stops processing stream when abort is called', () async {
    int onDataCallCount = 0;
    bool abortWasCalledInCallback = false;
    List<SyncEvent> receivedEventsBatch1 = [];
    final Completer<void> firstBatchReceived = Completer<void>();

    Future<void> onDataCallback(List<SyncEvent> events, Function() abort, Function() _) async {
      onDataCallCount++;
      if (onDataCallCount == 1) {
        receivedEventsBatch1 = events;
        abort();
        abortWasCalledInCallback = true;
        firstBatchReceived.complete();
      } else {
        fail("onData called more than once after abort was invoked");
      }
    }

    final streamChangesFuture = streamChanges(onDataCallback, const SemVer(major: 2, minor: 5, patch: 0));

    // Give the stream subscription time to start (longer delay to account for mock delay)
    await Future.delayed(const Duration(milliseconds: 50));

    for (int i = 0; i < testBatchSize; i++) {
      responseStreamController.add(
        utf8.encode(
          _createJsonLine(SyncEntityType.userDeleteV1.toString(), SyncUserDeleteV1(userId: "user$i").toJson(), 'ack$i'),
        ),
      );
    }

    await firstBatchReceived.future.timeout(
      const Duration(seconds: 5),
      onTimeout: () => fail('First batch was not processed within timeout'),
    );

    for (int i = testBatchSize; i < testBatchSize * 2; i++) {
      responseStreamController.add(
        utf8.encode(
          _createJsonLine(SyncEntityType.userDeleteV1.toString(), SyncUserDeleteV1(userId: "user$i").toJson(), 'ack$i'),
        ),
      );
    }

    await responseStreamController.close();
    await expectLater(streamChangesFuture, completes);

    expect(onDataCallCount, 1);
    expect(abortWasCalledInCallback, isTrue);
    expect(receivedEventsBatch1.length, testBatchSize);
    verify(() => mockHttpClient.close()).called(1);
  });

  test('streamChanges does not process remaining lines in finally block if aborted', () async {
    int onDataCallCount = 0;
    bool abortWasCalledInCallback = false;
    final Completer<void> firstBatchReceived = Completer<void>();

    Future<void> onDataCallback(List<SyncEvent> events, Function() abort, Function() _) async {
      onDataCallCount++;
      if (onDataCallCount == 1) {
        abort();
        abortWasCalledInCallback = true;
        firstBatchReceived.complete();
      } else {
        fail("onData called more than once after abort was invoked");
      }
    }

    final streamChangesFuture = streamChanges(onDataCallback, const SemVer(major: 2, minor: 5, patch: 0));

    await Future.delayed(const Duration(milliseconds: 50));

    for (int i = 0; i < testBatchSize; i++) {
      responseStreamController.add(
        utf8.encode(
          _createJsonLine(SyncEntityType.userDeleteV1.toString(), SyncUserDeleteV1(userId: "user$i").toJson(), 'ack$i'),
        ),
      );
    }

    await firstBatchReceived.future.timeout(
      const Duration(seconds: 5),
      onTimeout: () => fail('First batch was not processed within timeout'),
    );

    // emit a single event to skip batching and trigger finally
    responseStreamController.add(
      utf8.encode(
        _createJsonLine(SyncEntityType.userDeleteV1.toString(), SyncUserDeleteV1(userId: "user100").toJson(), 'ack100'),
      ),
    );

    await responseStreamController.close();
    await expectLater(streamChangesFuture, completes);

    expect(onDataCallCount, 1);
    expect(abortWasCalledInCallback, isTrue);
    verify(() => mockHttpClient.close()).called(1);
  });

  test('streamChanges processes remaining lines in finally block if not aborted', () async {
    int onDataCallCount = 0;
    List<SyncEvent> receivedEventsBatch1 = [];
    List<SyncEvent> receivedEventsBatch2 = [];
    final Completer<void> firstBatchReceived = Completer<void>();
    final Completer<void> secondBatchReceived = Completer<void>();

    Future<void> onDataCallback(List<SyncEvent> events, Function() _, Function() __) async {
      onDataCallCount++;
      if (onDataCallCount == 1) {
        receivedEventsBatch1 = events;
        firstBatchReceived.complete();
      } else if (onDataCallCount == 2) {
        receivedEventsBatch2 = events;
        secondBatchReceived.complete();
      } else {
        fail("onData called more than expected");
      }
    }

    final streamChangesFuture = streamChanges(onDataCallback, const SemVer(major: 2, minor: 5, patch: 0));

    await Future.delayed(const Duration(milliseconds: 50));

    // Batch 1
    for (int i = 0; i < testBatchSize; i++) {
      responseStreamController.add(
        utf8.encode(
          _createJsonLine(SyncEntityType.userDeleteV1.toString(), SyncUserDeleteV1(userId: "user$i").toJson(), 'ack$i'),
        ),
      );
    }

    await firstBatchReceived.future.timeout(
      const Duration(seconds: 5),
      onTimeout: () => fail('First batch was not processed within timeout'),
    );

    responseStreamController.add(
      utf8.encode(
        _createJsonLine(SyncEntityType.userDeleteV1.toString(), SyncUserDeleteV1(userId: "user100").toJson(), 'ack100'),
      ),
    );

    await responseStreamController.close();

    await secondBatchReceived.future.timeout(
      const Duration(seconds: 5),
      onTimeout: () => fail('Second batch was not processed within timeout'),
    );

    await expectLater(streamChangesFuture, completes);

    expect(onDataCallCount, 2);
    expect(receivedEventsBatch1.length, testBatchSize);
    expect(receivedEventsBatch2.length, 1);
    verify(() => mockHttpClient.close()).called(1);
  });

  test('streamChanges handles stream error gracefully', () async {
    final streamError = Exception("Network Error");
    int onDataCallCount = 0;

    Future<void> onDataCallback(List<SyncEvent> events, Function() _, Function() __) async {
      onDataCallCount++;
    }

    final streamChangesFuture = streamChanges(onDataCallback, const SemVer(major: 2, minor: 5, patch: 0));

    await Future.delayed(const Duration(milliseconds: 50));

    responseStreamController.add(
      utf8.encode(
        _createJsonLine(SyncEntityType.userDeleteV1.toString(), SyncUserDeleteV1(userId: "user1").toJson(), 'ack1'),
      ),
    );

    responseStreamController.addError(streamError);
    await expectLater(streamChangesFuture, throwsA(streamError));

    expect(onDataCallCount, 0);
    verify(() => mockHttpClient.close()).called(1);
  });

  test('streamChanges throws ApiException on non-200 status code', () async {
    when(() => mockStreamedResponse.statusCode).thenReturn(401);
    final errorBodyController = StreamController<List<int>>(sync: true);
    when(() => mockStreamedResponse.stream).thenAnswer((_) => http.ByteStream(errorBodyController.stream));

    int onDataCallCount = 0;
    Future<void> onDataCallback(List<SyncEvent> events, Function() _, Function() __) async {
      onDataCallCount++;
    }

    final future = streamChanges(onDataCallback, const SemVer(major: 2, minor: 5, patch: 0));

    errorBodyController.add(utf8.encode('{"error":"Unauthorized"}'));
    await errorBodyController.close();

    await expectLater(
      future,
      throwsA(
        isA<ApiException>()
            .having((e) => e.code, 'code', 401)
            .having((e) => e.message, 'message', contains('Unauthorized')),
      ),
    );

    expect(onDataCallCount, 0);
    verify(() => mockHttpClient.close()).called(1);
  });
}
