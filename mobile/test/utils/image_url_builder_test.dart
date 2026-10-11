import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/store.repository.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

void main() {
  const endpoint = 'http://localhost:3000';

  setUpAll(() async {
    final db = Drift(DatabaseConnection(NativeDatabase.memory(), closeStreamsSynchronously: true));
    await StoreService.init(storeRepository: StoreRepository(db), listenUpdates: false);
    await StoreService.I.put(StoreKey.serverEndpoint, endpoint);
    await SettingsRepository.ensureInitialized(db);
  });

  group('getFaceThumbnailUrl', () {
    test('omits the cache buster when updatedAt is null', () {
      expect(getFaceThumbnailUrl('person-1'), '$endpoint/people/person-1/thumbnail');
    });

    test('appends the updatedAt cache buster so a changed featured photo busts the cache (#27434)', () {
      final url = getFaceThumbnailUrl('person-1', updatedAt: DateTime.fromMillisecondsSinceEpoch(1717000000000));
      expect(url, '$endpoint/people/person-1/thumbnail?c=1717000000000');
    });

    test('a newer updatedAt yields a different url so the image cache key changes', () {
      final before = getFaceThumbnailUrl('person-1', updatedAt: DateTime.fromMillisecondsSinceEpoch(1));
      final after = getFaceThumbnailUrl('person-1', updatedAt: DateTime.fromMillisecondsSinceEpoch(2));
      expect(before, isNot(after));
    });
  });

  test('changes preview URLs with the media revision even when thumbhash is unchanged', () {
    final before = getThumbnailUrlForRemoteId('asset-1', thumbhash: 'same-hash', mediaRevision: 'first-render');
    final after = getThumbnailUrlForRemoteId('asset-1', thumbhash: 'same-hash', mediaRevision: 'second-render');

    expect(before, contains('c=first-render'));
    expect(after, contains('c=second-render'));
    expect(after, isNot(before));
  });

  test('retains thumbhash cache keys when connected to an older server', () {
    expect(getThumbnailUrlForRemoteId('asset-1', thumbhash: 'old-hash'), contains('c=old-hash'));
  });

  test('uses the developed server image for a merged asset while ordinary merged assets stay local', () {
    final asset = RemoteAsset(
      id: 'asset-1',
      localId: 'local-1',
      name: 'photo.nef',
      ownerId: 'user-1',
      checksum: 'source-hash',
      type: AssetType.image,
      createdAt: DateTime(2024),
      updatedAt: DateTime(2024),
      isEdited: false,
    );

    expect(getFullImageProvider(asset), isA<LocalFullImageProvider>());
    expect(getFullImageProvider(asset.copyWith(isDeveloped: true)), isA<RemoteFullImageProvider>());
  });

  test('changes full-image provider cache identity with the media revision', () {
    const before = RemoteFullImageProvider(
      assetId: 'asset-1',
      thumbhash: 'same-hash',
      mediaRevision: 'first-render',
      assetType: AssetType.image,
      isAnimated: false,
    );
    const after = RemoteFullImageProvider(
      assetId: 'asset-1',
      thumbhash: 'same-hash',
      mediaRevision: 'second-render',
      assetType: AssetType.image,
      isAnimated: false,
    );

    expect(after, isNot(before));
  });
}
