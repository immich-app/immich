import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/services/view_intent.service.dart';
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
