import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/services/view_intent_service.dart';
import 'package:mocktail/mocktail.dart';

class MockViewIntentHostApi extends Mock implements ViewIntentHostApi {}

void main() {
  late MockViewIntentHostApi hostApi;
  late ViewIntentService service;

  final attachment = ViewIntentPayload(
    path: '/tmp/file.jpg',
    type: ViewIntentType.image,
    mimeType: 'image/jpeg',
    localAssetId: '42',
  );

  setUp(() {
    hostApi = MockViewIntentHostApi();
    service = ViewIntentService(hostApi);
  });

  tearDown(() async {
    clearInteractions(hostApi);
  });

  test('checkViewIntent does nothing when no attachment', () async {
    when(() => hostApi.consumeViewIntent()).thenAnswer((_) async => null);

    var called = 0;
    service.onViewMedia = (_) async {
      called++;
    };

    await service.checkViewIntent();

    expect(called, 0);
    verify(() => hostApi.consumeViewIntent()).called(1);
  });

  test('checkViewIntent calls handler immediately when handler is set', () async {
    when(() => hostApi.consumeViewIntent()).thenAnswer((_) async => attachment);

    List<ViewIntentPayload>? received;
    service.onViewMedia = (attachments) async {
      received = attachments;
    };

    await service.checkViewIntent();

    expect(received, isNotNull);
    expect(received, hasLength(1));
    expect(received!.first, attachment);
    verify(() => hostApi.consumeViewIntent()).called(1);
  });

  test('checkViewIntent stores pending attachment when handler is not set', () async {
    when(() => hostApi.consumeViewIntent()).thenAnswer((_) async => attachment);

    await service.checkViewIntent();

    List<ViewIntentPayload>? received;
    service.onViewMedia = (attachments) async {
      received = attachments;
    };
    await service.flushPending();

    expect(received, isNotNull);
    expect(received, hasLength(1));
    expect(received!.first, attachment);
  });

  test('defer + flushPending does nothing without handler, then flushes once when handler appears', () async {
    service.defer(attachment);

    // No handler yet: should keep pending.
    await service.flushPending();

    var called = 0;
    List<ViewIntentPayload>? received;
    service.onViewMedia = (attachments) async {
      called++;
      received = attachments;
    };

    await service.flushPending();
    await service.flushPending();

    expect(called, 1);
    expect(received, hasLength(1));
    expect(received!.first, attachment);
  });

  test('checkViewIntent swallows host api errors', () async {
    when(() => hostApi.consumeViewIntent()).thenThrow(Exception('boom'));

    var called = 0;
    service.onViewMedia = (_) async {
      called++;
    };

    await service.checkViewIntent();

    expect(called, 0);
    verify(() => hostApi.consumeViewIntent()).called(1);
  });

  test('setManagedTempFilePath cleans previous managed temp file', () async {
    final tempRoot = await Directory.systemTemp.createTemp('view-intent-root');
    final cacheDir = Directory('${tempRoot.path}/cache')..createSync();
    addTearDown(() async {
      if (await tempRoot.exists()) {
        await tempRoot.delete(recursive: true);
      }
    });

    final firstFile = File('${cacheDir.path}/view_intent_first.jpg')..writeAsStringSync('first');
    final secondFile = File('${cacheDir.path}/view_intent_second.jpg')..writeAsStringSync('second');

    await service.setManagedTempFilePath(firstFile.path);
    await service.setManagedTempFilePath(secondFile.path);

    expect(await firstFile.exists(), isFalse);
    expect(await secondFile.exists(), isTrue);

    await service.cleanupManagedTempFile();
    expect(await secondFile.exists(), isFalse);
  });

  test('cleanupTempFile ignores non-managed paths', () async {
    final tempDir = await Directory.systemTemp.createTemp('view-intent-test');
    addTearDown(() async {
      if (await tempDir.exists()) {
        await tempDir.delete(recursive: true);
      }
    });

    final nonManagedFile = File('${tempDir.path}/plain_file.jpg')..writeAsStringSync('content');

    await service.cleanupTempFile(nonManagedFile.path);

    expect(await nonManagedFile.exists(), isTrue);
  });
}
