import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/services/view_intent.service.dart';
import 'package:mocktail/mocktail.dart';

class MockViewIntentHostApi extends Mock implements ViewIntentHostApi {}

void main() {
  late MockViewIntentHostApi hostApi;
  late ViewIntentService service;
  late Directory tempRoot;
  late Directory cacheDir;

  final attachment = ViewIntentPayload(
    path: '/tmp/file.jpg',
    mimeType: 'image/jpeg',
    localAssetId: '42',
  );

  setUp(() {
    hostApi = MockViewIntentHostApi();
    tempRoot = Directory.systemTemp.createTempSync('view-intent-root');
    cacheDir = Directory('${tempRoot.path}/cache')..createSync();
    service = ViewIntentService(hostApi, temporaryDirectory: () async => cacheDir);
  });

  tearDown(() async {
    clearInteractions(hostApi);
    if (await tempRoot.exists()) {
      await tempRoot.delete(recursive: true);
    }
  });

  test('consumeViewIntent returns null when no attachment', () async {
    when(() => hostApi.consumeViewIntent()).thenAnswer((_) async => null);

    final result = await service.consumeViewIntent();

    expect(result, isNull);
    verify(() => hostApi.consumeViewIntent()).called(1);
  });

  test('consumeViewIntent returns attachment when present', () async {
    when(() => hostApi.consumeViewIntent()).thenAnswer((_) async => attachment);

    final result = await service.consumeViewIntent();

    expect(result, attachment);
    verify(() => hostApi.consumeViewIntent()).called(1);
  });

  test('consumeViewIntent swallows host api errors', () async {
    when(() => hostApi.consumeViewIntent()).thenThrow(Exception('boom'));

    final result = await service.consumeViewIntent();

    expect(result, isNull);
    verify(() => hostApi.consumeViewIntent()).called(1);
  });

  test('setManagedTempFilePath cleans previous managed temp file', () async {
    final firstFile = File('${cacheDir.path}/view_intent_first.jpg')..writeAsStringSync('first');
    final secondFile = File('${cacheDir.path}/view_intent_second.jpg')..writeAsStringSync('second');

    await service.setManagedTempFilePath(firstFile.path);
    await service.setManagedTempFilePath(secondFile.path);

    expect(await firstFile.exists(), isFalse);
    expect(await secondFile.exists(), isTrue);

    await service.cleanupManagedTempFile();
    expect(await secondFile.exists(), isFalse);
  });

  test('cleanupTempFile defers deletion while an upload is active', () async {
    final tempFile = File('${cacheDir.path}/view_intent_in_flight.jpg')..writeAsStringSync('bytes');

    service.markUploadActive(tempFile.path);
    await service.cleanupTempFile(tempFile.path);

    expect(await tempFile.exists(), isTrue, reason: 'active uploads block cleanup');

    await service.markUploadInactive(tempFile.path);
    expect(await tempFile.exists(), isFalse);
  });

  test('cleanupTempFile ignores non-managed paths', () async {
    final nonManagedFile = File('${tempRoot.path}/plain_file.jpg')..writeAsStringSync('content');

    await service.cleanupTempFile(nonManagedFile.path);

    expect(await nonManagedFile.exists(), isTrue);
  });

  test('cleanupStaleTempFiles removes view-intent temp files and keeps unrelated files', () async {
    final firstFile = File('${cacheDir.path}/view_intent_first.jpg')..writeAsStringSync('first');
    final secondFile = File('${cacheDir.path}/view_intent_second.jpg')..writeAsStringSync('second');
    final unrelatedFile = File('${cacheDir.path}/plain_file.jpg')..writeAsStringSync('plain');

    await service.cleanupStaleTempFiles();

    expect(await firstFile.exists(), isFalse);
    expect(await secondFile.exists(), isFalse);
    expect(await unrelatedFile.exists(), isTrue);
  });

  test('cleanupStaleTempFiles skips paths with active uploads', () async {
    final stale = File('${cacheDir.path}/view_intent_stale.jpg')..writeAsStringSync('stale');
    final active = File('${cacheDir.path}/view_intent_active.jpg')..writeAsStringSync('active');
    service.markUploadActive(active.path);

    await service.cleanupStaleTempFiles();

    expect(await stale.exists(), isFalse);
    expect(await active.exists(), isTrue);
  });
}
