import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/repositories/asset_media.repository.dart';
import 'package:path/path.dart' as p;

import '../test_utils.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUpAll(() {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger.setMockMethodCallHandler(
      const MethodChannel('plugins.flutter.io/path_provider'),
      (methodCall) async => '/tmp/immich-share-test',
    );
  });

  DownloadTask buildTask(String taskId, String displayName) => AssetMediaRepository.buildShareDownloadTask(
    taskId: taskId,
    url: 'https://example.com/api/assets/some-id/original',
    headers: const {},
    displayName: displayName,
  );

  group('buildShareDownloadTask', () {
    test('saves a unique original under the asset name, without the task id prefix (#29468)', () async {
      final task = buildTask('share-original-some-remote-id-123456', 'IMG-0001.jpg');

      expect(task.filename, 'IMG-0001.jpg');
      expect(p.basename(await task.filePath()), 'IMG-0001.jpg');
    });

    test('preview shares keep their -preview name', () async {
      final task = buildTask('share-preview-some-remote-id-123456', 'IMG-0001-preview.jpg');

      expect(p.basename(await task.filePath()), 'IMG-0001-preview.jpg');
    });

    test('names with spaces and unusual characters pass through untouched', () {
      const name = 'photo 1 (final) 名字.jpg';
      final task = buildTask('share-original-some-remote-id-123456', name);

      expect(task.filename, name);
    });
  });

  group('shareDisplayName', () {
    // receivers flatten attachments into one list, so identical names clobber each other
    test('same-named assets get ordinal names after the first', () {
      final first = TestUtils.createRemoteAsset(id: 'remote-1').copyWith(name: 'IMG-0001.jpg');
      final second = TestUtils.createRemoteAsset(id: 'remote-2').copyWith(name: 'IMG-0001.jpg');
      final occurrences = <String, int>{};

      expect(AssetMediaRepository.shareDisplayName(first, ShareAssetType.original, occurrences), 'IMG-0001.jpg');
      expect(AssetMediaRepository.shareDisplayName(second, ShareAssetType.original, occurrences), 'IMG-0001 (1).jpg');
    });

    test('sharing the same asset twice gives the second copy an ordinal name', () {
      final asset = TestUtils.createRemoteAsset(id: 'remote-1').copyWith(name: 'IMG-0001.jpg');
      final occurrences = <String, int>{};

      AssetMediaRepository.shareDisplayName(asset, ShareAssetType.original, occurrences);

      expect(AssetMediaRepository.shareDisplayName(asset, ShareAssetType.original, occurrences), 'IMG-0001 (1).jpg');
    });

    // the preview fallback shares the original file under an original-style name, which must not
    // inherit an ordinal from the preview name counted for the same asset
    test('preview and original names are counted separately', () {
      final asset = TestUtils.createRemoteAsset(id: 'remote-1').copyWith(name: 'IMG-0001.jpg');
      final occurrences = <String, int>{};

      expect(AssetMediaRepository.shareDisplayName(asset, ShareAssetType.preview, occurrences), 'IMG-0001-preview.jpg');
      expect(AssetMediaRepository.shareDisplayName(asset, ShareAssetType.original, occurrences), 'IMG-0001.jpg');
    });
  });

  group('getOriginalShareFilename', () {
    test('falls back to the remote id when the name is empty', () {
      final asset = TestUtils.createRemoteAsset(id: 'remote-1').copyWith(name: '');

      expect(AssetMediaRepository.getOriginalShareFilename(asset), 'remote-1');
    });

    test('falls back when the name is only path separators', () {
      final asset = TestUtils.createRemoteAsset(id: 'remote-1').copyWith(name: r'\/');

      expect(AssetMediaRepository.getOriginalShareFilename(asset), 'remote-1');
    });

    test('falls back to the local id when there is no remote id', () {
      final asset = TestUtils.createLocalAsset(id: 'local-1').copyWith(name: '');

      expect(AssetMediaRepository.getOriginalShareFilename(asset), 'local-1');
    });

    test('sanitizes separators in a real name instead of falling back', () {
      final asset = TestUtils.createRemoteAsset(id: 'remote-1').copyWith(name: 'holiday/IMG-0001.jpg');

      expect(AssetMediaRepository.getOriginalShareFilename(asset), 'holiday_IMG-0001.jpg');
    });
  });

  group('cleanupShareTempFiles', () {
    test('removes only the owned task directories and temp files', () async {
      final tempRoot = Directory.systemTemp.createTempSync('immich-share-cleanup');
      addTearDown(() => tempRoot.deleteSync(recursive: true));
      final taskDir = Directory(p.join(tempRoot.path, 'share-original-remote-1-111'))..createSync();
      final downloaded = File(p.join(taskDir.path, 'IMG-0001.jpg'))..createSync();
      final iosLocalTemp = File(p.join(tempRoot.path, 'local-original.jpg'))..createSync();
      final foreignDir = Directory(p.join(tempRoot.path, 'unrelated'))..createSync();
      final foreignFile = File(p.join(foreignDir.path, 'keep.jpg'))..createSync();

      await AssetMediaRepository.cleanupShareTempFiles([taskDir, iosLocalTemp]);

      expect(taskDir.existsSync(), isFalse);
      expect(downloaded.existsSync(), isFalse);
      expect(iosLocalTemp.existsSync(), isFalse);
      expect(foreignDir.existsSync(), isTrue);
      expect(foreignFile.existsSync(), isTrue);
      expect(tempRoot.existsSync(), isTrue);
    });
  });
}
