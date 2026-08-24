import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/repositories/upload.repository.dart';
import 'package:mocktail/mocktail.dart';

class _MockHttpClient extends Mock implements http.Client {}

class _FakeBaseRequest extends Fake implements http.BaseRequest {}

// keeps the FileDownloader singleton off the disk and off the platform channels
class _NoStorage extends Fake implements PersistentStorage {
  @override
  Future<void> initialize() async {}
}

void main() {
  late _MockHttpClient client;
  late UploadRepository sut;
  late File file;

  setUpAll(() async {
    TestWidgetsFlutterBinding.ensureInitialized();
    FileDownloader(persistentStorage: _NoStorage());
    final db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: StoreRepository(db));
    await Store.put(StoreKey.serverEndpoint, 'http://demo.immich.app/api');
    registerFallbackValue(_FakeBaseRequest());
    file = File('${Directory.systemTemp.createTempSync().path}/photo.jpg')..writeAsStringSync('bytes');
  });

  setUp(() {
    client = _MockHttpClient();
    sut = UploadRepository();
  });

  // consumes the body like a real client would, so a reused request would blow up on the second send
  void stubSend(FutureOr<http.StreamedResponse> Function(int attempt) answer) {
    var attempt = 0;
    when(() => client.send(any())).thenAnswer((invocation) async {
      final request = invocation.positionalArguments.single as http.BaseRequest;
      await request.finalize().drain<void>();
      return answer(++attempt);
    });
  }

  http.StreamedResponse response(int status, String body) =>
      http.StreamedResponse(Stream.value(utf8.encode(body)), status);

  Future<UploadResult> upload() => sut.uploadFile(
    file: file,
    originalFileName: 'photo.jpg',
    fields: const {'deviceAssetId': 'a1'},
    cancelToken: null,
    logContext: 'a1',
    httpClient: client,
  );

  test('resends once when the first send dies before a response', () async {
    stubSend((attempt) {
      if (attempt == 1) {
        throw http.ClientException('Broken pipe');
      }
      return response(201, '{"id":"remote-1"}');
    });

    final result = await upload();

    expect(result.isSuccess, isTrue);
    expect(result.remoteAssetId, 'remote-1');
    verify(() => client.send(any())).called(2);
  });

  test('a second transport failure is an error, no third send', () async {
    stubSend((_) => throw http.ClientException('Connection reset'));

    final result = await upload();

    expect(result.isSuccess, isFalse);
    expect(result.isCancelled, isFalse);
    verify(() => client.send(any())).called(2);
  });

  test('a cancelled upload is not resent', () async {
    stubSend((_) => throw http.RequestAbortedException());

    final result = await upload();

    expect(result.isCancelled, isTrue);
    verify(() => client.send(any())).called(1);
  });

  test('a cancel during the resend still counts as cancelled', () async {
    stubSend((attempt) {
      if (attempt == 1) {
        throw http.ClientException('Broken pipe');
      }
      throw http.RequestAbortedException();
    });

    final result = await upload();

    expect(result.isCancelled, isTrue);
    verify(() => client.send(any())).called(2);
  });

  test('a server error response is not resent', () async {
    stubSend((_) => response(500, '{"message":"boom"}'));

    final result = await upload();

    expect(result.statusCode, 500);
    expect(result.errorMessage, 'boom');
    verify(() => client.send(any())).called(1);
  });
}
