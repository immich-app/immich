import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/utils/share_asset.dart';

LocalAsset _local({
  String id = 'local-1',
  String? remoteId,
  AssetType type = AssetType.image,
  bool isEdited = false,
  String name = 'photo.jpg',
}) {
  return LocalAsset(
    id: id,
    remoteId: remoteId,
    name: name,
    type: type,
    createdAt: DateTime(2025),
    updatedAt: DateTime(2025),
    playbackStyle: type == AssetType.video ? AssetPlaybackStyle.video : AssetPlaybackStyle.image,
    isEdited: isEdited,
  );
}

RemoteAsset _remote({
  String id = 'remote-1',
  String? localId,
  AssetType type = AssetType.image,
  bool isEdited = false,
  String name = 'photo.jpg',
}) {
  return RemoteAsset(
    id: id,
    localId: localId,
    name: name,
    ownerId: 'owner-1',
    checksum: 'checksum-1',
    type: type,
    createdAt: DateTime(2025),
    updatedAt: DateTime(2025),
    isEdited: isEdited,
  );
}

void main() {
  group('canShareAsPreview', () {
    test('true for a remote-only image', () {
      expect(canShareAsPreview(_remote()), isTrue);
    });

    test('true for a merged image regardless of which model carries it', () {
      expect(canShareAsPreview(_remote(localId: 'local-1')), isTrue);
      expect(canShareAsPreview(_local(remoteId: 'remote-1')), isTrue);
    });

    test('false for a local-only image (no server preview exists)', () {
      expect(canShareAsPreview(_local()), isFalse);
    });

    test('false for videos even when remote (preview is a still JPEG)', () {
      expect(canShareAsPreview(_remote(type: AssetType.video)), isFalse);
      expect(canShareAsPreview(_remote(localId: 'local-1', type: AssetType.video)), isFalse);
    });
  });

  group('shouldOfferShareQualityChoice', () {
    test('false for an empty selection', () {
      expect(shouldOfferShareQualityChoice(const []), isFalse);
    });

    test('false when nothing can provide a preview', () {
      expect(shouldOfferShareQualityChoice([_local(), _remote(type: AssetType.video)]), isFalse);
    });

    test('true when at least one asset can provide a preview', () {
      expect(shouldOfferShareQualityChoice([_local(), _remote()]), isTrue);
    });
  });

  group('resolveShareSource - local-only', () {
    final asset = _local();

    test('original reads the local file', () {
      expect(resolveShareSource(asset, ShareAssetQuality.original), const ShareSource.localFile('local-1'));
    });

    test('preview falls back to the local file (no remote preview available)', () {
      expect(resolveShareSource(asset, ShareAssetQuality.preview), const ShareSource.localFile('local-1'));
    });

    test('edited local-only asset still falls back to the local file', () {
      final edited = _local(isEdited: true);
      expect(resolveShareSource(edited, ShareAssetQuality.original), const ShareSource.localFile('local-1'));
      expect(resolveShareSource(edited, ShareAssetQuality.preview), const ShareSource.localFile('local-1'));
    });
  });

  group('resolveShareSource - remote-only', () {
    final asset = _remote();

    test('original downloads the original', () {
      expect(resolveShareSource(asset, ShareAssetQuality.original), const ShareSource.remoteOriginal('remote-1'));
    });

    test('preview downloads the preview', () {
      expect(resolveShareSource(asset, ShareAssetQuality.preview), const ShareSource.remotePreview('remote-1'));
    });

    test('edited remote video downloads the original even when preview is requested', () {
      final video = _remote(type: AssetType.video, isEdited: true);
      expect(resolveShareSource(video, ShareAssetQuality.preview), const ShareSource.remoteOriginal('remote-1'));
    });
  });

  group('resolveShareSource - merged', () {
    final mergedFromRemote = _remote(localId: 'local-1');
    final mergedFromLocal = _local(remoteId: 'remote-1');

    test('original prefers the local file when not edited', () {
      expect(resolveShareSource(mergedFromRemote, ShareAssetQuality.original), const ShareSource.localFile('local-1'));
      expect(resolveShareSource(mergedFromLocal, ShareAssetQuality.original), const ShareSource.localFile('local-1'));
    });

    test('preview downloads the preview from the server', () {
      expect(resolveShareSource(mergedFromRemote, ShareAssetQuality.preview), const ShareSource.remotePreview('remote-1'));
      expect(resolveShareSource(mergedFromLocal, ShareAssetQuality.preview), const ShareSource.remotePreview('remote-1'));
    });

    test('edited asset downloads the original instead of using the stale local file', () {
      final edited = _remote(localId: 'local-1', isEdited: true);
      expect(resolveShareSource(edited, ShareAssetQuality.original), const ShareSource.remoteOriginal('remote-1'));
    });

    test('edited asset can still share the (edited) preview', () {
      final edited = _remote(localId: 'local-1', isEdited: true);
      expect(resolveShareSource(edited, ShareAssetQuality.preview), const ShareSource.remotePreview('remote-1'));
    });

    test('video uses the local file even when preview is requested', () {
      final video = _remote(localId: 'local-1', type: AssetType.video);
      expect(resolveShareSource(video, ShareAssetQuality.preview), const ShareSource.localFile('local-1'));
    });
  });

  group('ShareSource helpers', () {
    test('expose the right flags', () {
      const local = ShareSource.localFile('a');
      const original = ShareSource.remoteOriginal('b');
      const preview = ShareSource.remotePreview('c');

      expect(local.isLocal, isTrue);
      expect(local.requiresDownload, isFalse);
      expect(local.isPreview, isFalse);

      expect(original.requiresDownload, isTrue);
      expect(original.isPreview, isFalse);

      expect(preview.requiresDownload, isTrue);
      expect(preview.isPreview, isTrue);
    });
  });

  group('shareFilename', () {
    test('keeps the original filename for non-preview sources', () {
      final asset = _remote(name: 'IMG_0001.HEIC');
      expect(shareFilename(asset, const ShareSource.remoteOriginal('remote-1')), 'IMG_0001.HEIC');
      expect(shareFilename(asset, const ShareSource.localFile('local-1')), 'IMG_0001.HEIC');
    });

    test('normalizes the extension to .jpg for preview sources', () {
      final raw = _remote(name: 'IMG_0001.CR2');
      expect(shareFilename(raw, const ShareSource.remotePreview('remote-1')), 'IMG_0001.jpg');
    });

    test('appends .jpg when the preview asset has no extension', () {
      final asset = _remote(name: 'no_extension');
      expect(shareFilename(asset, const ShareSource.remotePreview('remote-1')), 'no_extension.jpg');
    });

    test('sanitizes path separators in the filename', () {
      final asset = _remote(name: 'sub/dir\\file.png');
      expect(shareFilename(asset, const ShareSource.remoteOriginal('remote-1')), 'sub_dir_file.png');
      expect(shareFilename(asset, const ShareSource.remotePreview('remote-1')), 'sub_dir_file.jpg');
    });
  });
}
