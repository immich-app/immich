import 'package:drift/drift.dart' hide isNull, isNotNull;
import 'package:drift/native.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/db.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';

import '../../../unit/presentation_context.dart';

void main() {
  late Drift db;

  setUpAll(() async {
    db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await SettingsRepository.ensureInitialized(db);
  });

  tearDownAll(() async {
    await db.close();
  });

  LocalAsset makeLocalAsset(String id, {String? checksum}) => LocalAsset(
    id: id,
    name: '$id.jpg',
    checksum: checksum,
    type: AssetType.image,
    createdAt: DateTime(2025),
    updatedAt: DateTime(2025),
    playbackStyle: AssetPlaybackStyle.image,
    isEdited: false,
  );

  RemoteAsset makeMergedRemoteAsset({String? localChecksum}) => RemoteAsset(
    id: 'R',
    localId: 'X',
    name: 'x.jpg',
    ownerId: 'owner',
    checksum: 'server',
    type: AssetType.image,
    createdAt: DateTime(2025),
    updatedAt: DateTime(2025),
    isEdited: false,
    localChecksum: localChecksum,
  );

  group('local image provider cache keys include checksum', () {
    test('LocalThumbProvider with a different checksum is a different key', () {
      final c1 = LocalThumbProvider(id: 'L', assetType: AssetType.image, checksum: 'c1');
      final c2 = LocalThumbProvider(id: 'L', assetType: AssetType.image, checksum: 'c2');
      final c1Again = LocalThumbProvider(id: 'L', assetType: AssetType.image, checksum: 'c1');

      // an on-device edit keeps the id but re-hashes to a new checksum → must miss the cache
      expect(c1 == c2, isFalse);
      expect(c1.hashCode == c2.hashCode, isFalse);
      // same id + same checksum → same key (cache hit)
      expect(c1 == c1Again, isTrue);
      expect(c1.hashCode, c1Again.hashCode);
    });

    test('LocalFullImageProvider with a different checksum is a different key', () {
      final c1 = LocalFullImageProvider(
        id: 'L',
        assetType: AssetType.image,
        size: const Size(100, 100),
        isAnimated: false,
        checksum: 'c1',
      );
      final c2 = LocalFullImageProvider(
        id: 'L',
        assetType: AssetType.image,
        size: const Size(100, 100),
        isAnimated: false,
        checksum: 'c2',
      );

      expect(c1 == c2, isFalse);
      expect(c1.hashCode == c2.hashCode, isFalse);
    });

    test('LocalThumbProvider null vs non-null checksum is a different key', () {
      final unhashed = LocalThumbProvider(id: 'L', assetType: AssetType.image);
      final hashed = LocalThumbProvider(id: 'L', assetType: AssetType.image, checksum: 'c1');

      // a rehash takes the checksum null → 'c1'; the stale render must not be reused
      expect(unhashed == hashed, isFalse);
      expect(hashed == unhashed, isFalse);
    });

    test('LocalFullImageProvider null vs non-null checksum is a different key', () {
      final unhashed = LocalFullImageProvider(
        id: 'L',
        assetType: AssetType.image,
        size: const Size(100, 100),
        isAnimated: false,
      );
      final hashed = LocalFullImageProvider(
        id: 'L',
        assetType: AssetType.image,
        size: const Size(100, 100),
        isAnimated: false,
        checksum: 'c1',
      );

      expect(unhashed == hashed, isFalse);
      expect(hashed == unhashed, isFalse);
    });

    test('LocalThumbProvider equality ignores size', () {
      final small = LocalThumbProvider(id: 'L', assetType: AssetType.image, checksum: 'c1', size: const Size(50, 50));
      final big = LocalThumbProvider(id: 'L', assetType: AssetType.image, checksum: 'c1', size: const Size(200, 200));

      // viewer fast-path: any cached thumb render is reusable regardless of requested size
      expect(small == big, isTrue);
      expect(small.hashCode, big.hashCode);
    });

    test('LocalFullImageProvider with same id, size, isAnimated and checksum is equal', () {
      final a = LocalFullImageProvider(
        id: 'L',
        assetType: AssetType.image,
        size: const Size(100, 100),
        isAnimated: false,
        checksum: 'c1',
      );
      final b = LocalFullImageProvider(
        id: 'L',
        assetType: AssetType.image,
        size: const Size(100, 100),
        isAnimated: false,
        checksum: 'c1',
      );

      expect(a == b, isTrue);
      expect(a.hashCode, b.hashCode);
    });
  });

  group('factory checksum plumbing', () {
    test('getThumbnailImageProvider carries the local asset checksum', () {
      final provider = getThumbnailImageProvider(makeLocalAsset('X', checksum: 'c1'));

      expect(provider, isA<LocalThumbProvider>());
      expect((provider as LocalThumbProvider).checksum, 'c1');
    });

    test('getFullImageProvider carries the local asset checksum', () {
      final provider = getFullImageProvider(makeLocalAsset('X', checksum: 'c1'));

      expect(provider, isA<LocalFullImageProvider>());
      expect((provider as LocalFullImageProvider).checksum, 'c1');
    });

    test('same id with a different checksum produces unequal providers', () {
      final thumb1 = getThumbnailImageProvider(makeLocalAsset('X', checksum: 'c1'));
      final thumb2 = getThumbnailImageProvider(makeLocalAsset('X', checksum: 'c2'));
      final full1 = getFullImageProvider(makeLocalAsset('X', checksum: 'c1'));
      final full2 = getFullImageProvider(makeLocalAsset('X', checksum: 'c2'));

      expect(thumb1 == thumb2, isFalse);
      expect(full1 == full2, isFalse);
    });
  });

  group('RemoteAsset localChecksum preference', () {
    test('merged remote keys local renders by localChecksum when set', () {
      final asset = makeMergedRemoteAsset(localChecksum: 'device');

      // localId set → hasLocal, so the factory takes the local path
      expect(asset.hasLocal, isTrue);

      final thumb = getThumbnailImageProvider(asset);
      expect(thumb, isA<LocalThumbProvider>());
      expect((thumb as LocalThumbProvider).checksum, 'device');

      final full = getFullImageProvider(asset);
      expect(full, isA<LocalFullImageProvider>());
      expect((full as LocalFullImageProvider).checksum, 'device');
    });

    test('merged remote without a localChecksum renders the remote, not the local bytes', () async {
      // A prior-linked local that hasn't rehashed yet has no trustworthy cache
      // key — its bytes may differ from the server checksum.
      await PresentationContext.create();
      final asset = makeMergedRemoteAsset();

      final thumb = getThumbnailImageProvider(asset);
      expect(thumb, isNot(isA<LocalThumbProvider>()));

      final full = getFullImageProvider(asset);
      expect(full, isNot(isA<LocalFullImageProvider>()));
    });
  });
}
