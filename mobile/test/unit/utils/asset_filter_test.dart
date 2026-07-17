import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/utils/asset_filter.dart';

import '../factories/local_asset_factory.dart';
import '../factories/remote_asset_factory.dart';

void main() {
  group('AssetFilter', () {
    group('type promotion', () {
      test('a bare filter retains every BaseAsset', () {
        final remoteAsset = RemoteAssetFactory.create();
        final localAsset = LocalAssetFactory.create();

        final AssetFilter<BaseAsset> filter = AssetFilter(<BaseAsset>[remoteAsset, localAsset]);

        expect(filter.toList(), [remoteAsset, localAsset]);
      });

      test('remote keeps only remote assets', () {
        final remoteAsset = RemoteAssetFactory.create();
        final localAsset = LocalAssetFactory.create();

        final AssetFilter<RemoteAsset> remoteOnly = AssetFilter(<BaseAsset>[remoteAsset, localAsset]).remote();

        expect(remoteOnly.toList(), [remoteAsset]);
      });

      test('local keeps only local assets', () {
        final remoteAsset = RemoteAssetFactory.create();
        final localAsset = LocalAssetFactory.create();

        final AssetFilter<LocalAsset> localOnly = AssetFilter(<BaseAsset>[remoteAsset, localAsset]).local();

        expect(localOnly.toList(), [localAsset]);
      });

      test('owned promotes to RemoteAsset and drops local assets', () {
        final remoteAsset = RemoteAssetFactory.create();
        final localAsset = LocalAssetFactory.create();

        final AssetFilter<RemoteAsset> remoteOnly = AssetFilter(<BaseAsset>[
          remoteAsset,
          localAsset,
        ]).owned(remoteAsset.ownerId);

        expect(remoteOnly.toList(), [remoteAsset]);
      });

      test('backedUp promotes to LocalAsset and drops remote assets', () {
        final syncedPhoto = LocalAssetFactory.create().copyWith(remoteId: 'remote');
        final offlinePhoto = LocalAssetFactory.create();
        final remotePhoto = RemoteAssetFactory.create();

        final AssetFilter<LocalAsset> syncedPhotos = AssetFilter(<BaseAsset>[
          syncedPhoto,
          offlinePhoto,
          remotePhoto,
        ]).backedUp();

        expect(syncedPhotos.toList(), [syncedPhoto]);
      });
    });

    group('named filters', () {
      test('owned keeps only assets of the given owner', () {
        final asset1 = RemoteAssetFactory.create();
        final asset2 = RemoteAssetFactory.create();

        final alexPhotos = AssetFilter([asset1, asset2]).owned(asset1.ownerId);

        expect(alexPhotos.toList(), [asset1]);
      });

      test('favorites keeps only favorite assets', () {
        final asset1 = RemoteAssetFactory.create(isFavorite: true);
        final asset2 = RemoteAssetFactory.create(ownerId: asset1.ownerId);

        final favorites = AssetFilter([asset1, asset2]).favorite();

        expect(favorites.toList(), [asset1]);
      });

      test('type keeps only assets of the given type', () {
        final image = RemoteAssetFactory.create();
        final video = RemoteAssetFactory.create(ownerId: image.ownerId).copyWith(type: .video);

        final videos = AssetFilter([image, video]).type(.video);

        expect(videos.toList(), [video]);
      });

      test('visibility keeps only assets with the given visibility', () {
        final locked = RemoteAssetFactory.create(visibility: AssetVisibility.locked);
        final onTimeline = RemoteAssetFactory.create(ownerId: locked.ownerId);

        final lockedPhotos = AssetFilter([locked, onTimeline]).visibility(.locked);

        expect(lockedPhotos.toList(), [locked]);
      });

      test('archived keeps only archived assets', () {
        final archived = RemoteAssetFactory.create(visibility: AssetVisibility.archive);
        final onTimeline = RemoteAssetFactory.create(ownerId: archived.ownerId);

        final archivedPhotos = AssetFilter([archived, onTimeline]).archived();

        expect(archivedPhotos.toList(), [archived]);
      });

      test('stacked keeps only assets belonging to a stack', () {
        final stacked = RemoteAssetFactory.create(stackId: 'stack');
        final loose = RemoteAssetFactory.create(ownerId: stacked.ownerId);

        final stackedPhotos = AssetFilter([stacked, loose]).stacked();

        expect(stackedPhotos.toList(), [stacked]);
      });
    });

    group('inversion', () {
      test('notArchived keeps every non-archived visibility', () {
        final archived = RemoteAssetFactory.create(visibility: AssetVisibility.archive);
        final onTimeline = RemoteAssetFactory.create(ownerId: archived.ownerId, visibility: AssetVisibility.timeline);
        final hidden = RemoteAssetFactory.create(ownerId: archived.ownerId, visibility: AssetVisibility.hidden);
        final locked = RemoteAssetFactory.create(ownerId: archived.ownerId, visibility: AssetVisibility.locked);

        final visiblePhotos = AssetFilter([archived, onTimeline, hidden, locked]).archived(isArchived: false);

        expect(visiblePhotos.toSet(), {onTimeline, hidden, locked});
      });

      test('notVisibility keeps every asset not at the target visibility', () {
        final archived = RemoteAssetFactory.create(visibility: AssetVisibility.archive);
        final onTimeline = RemoteAssetFactory.create(ownerId: archived.ownerId, visibility: AssetVisibility.timeline);
        final locked = RemoteAssetFactory.create(ownerId: archived.ownerId, visibility: AssetVisibility.locked);

        final toArchive = AssetFilter([archived, onTimeline, locked]).notVisibility(.archive);

        expect(toArchive.toSet(), {onTimeline, locked});
      });

      test('notStacked keeps only assets without a stack', () {
        final stacked = RemoteAssetFactory.create(stackId: 'stack');
        final loose = RemoteAssetFactory.create(ownerId: stacked.ownerId);

        final loosePhotos = AssetFilter([stacked, loose]).stacked(isStacked: false);

        expect(loosePhotos.toList(), [loose]);
      });

      test('whereNot inverts an arbitrary predicate', () {
        final favorite = RemoteAssetFactory.create(isFavorite: true);
        final regular = RemoteAssetFactory.create(ownerId: favorite.ownerId);

        final nonFavorites = AssetFilter([favorite, regular]).whereNot((asset) => asset.isFavorite);

        expect(nonFavorites.toList(), [regular]);
      });

      test('notFavorites keeps only non-favorite assets', () {
        final favorite = RemoteAssetFactory.create(isFavorite: true);
        final regular = RemoteAssetFactory.create(ownerId: favorite.ownerId);

        final nonFavorites = AssetFilter([favorite, regular]).favorite(isFavorite: false);

        expect(nonFavorites.toList(), [regular]);
      });
    });

    group('chaining', () {
      test('combines predicates across owner, visibility and stack', () {
        final asset = RemoteAssetFactory.create();
        final wrongOwner = RemoteAssetFactory.create();
        final archived = RemoteAssetFactory.create(ownerId: asset.ownerId, visibility: AssetVisibility.archive);
        final stacked = RemoteAssetFactory.create(ownerId: asset.ownerId, stackId: 'stack-1');
        final localPhoto = LocalAssetFactory.create();

        final result = AssetFilter(<BaseAsset>[
          asset,
          wrongOwner,
          archived,
          stacked,
          localPhoto,
        ]).owned(asset.ownerId).archived(isArchived: false).stacked(isStacked: false);

        expect(result.toList(), [asset]);
      });

      test('a base filter after a promotion retains the promoted type', () {
        final favorite = RemoteAssetFactory.create(isFavorite: true);
        final regular = RemoteAssetFactory.create(ownerId: favorite.ownerId);

        final AssetFilter<RemoteAsset> result = AssetFilter([favorite, regular]).owned(favorite.ownerId).favorite();

        expect(result.toList(), [favorite]);
      });
    });
  });
}
