import 'package:collection/collection.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/modules/album/providers/album_sort_by_options.provider.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/user.dart';
import 'package:isar/isar.dart';

import 'album.stub.dart';
import 'asset.stub.dart';

void main() {
  late final Isar db;

  setUpAll(() async {
    await Isar.initializeIsarCore(download: true);
    db = await Isar.open(
      [
        AssetSchema,
        AlbumSchema,
        UserSchema,
      ],
      maxSizeMiB: 256,
      directory: ".",
    );
  });

  final albums = [
    AlbumStub.emptyAlbum,
    AlbumStub.sharedWithUser,
    AlbumStub.oneAsset,
    AlbumStub.twoAsset,
  ];

  setUp(() {
    db.writeTxnSync(() {
      db.clearSync();
      // Save all assets
      db.assets.putAllSync([AssetStub.image1, AssetStub.image2]);
      db.albums.putAllSync(albums);
      for (final album in albums) {
        album.sharedUsers.saveSync();
        album.assets.saveSync();
      }
    });
    expect(db.albums.countSync(), 4);
    expect(db.assets.countSync(), 2);
  });

  group("Album sort - Created Time", () {
    const created = AlbumSortMode.created;
    test("Created time - ASC", () {
      final sorted = created.sortFn(albums, false);
      expect(sorted.isSortedBy((a) => a.createdAt), true);
    });

    test("Created time - DESC", () {
      final sorted = created.sortFn(albums, true);
      expect(
        sorted.isSorted((b, a) => a.createdAt.compareTo(b.createdAt)),
        true,
      );
    });
  });

  group("Album sort - Asset count", () {
    const assetCount = AlbumSortMode.assetCount;
    test("Asset Count - ASC", () {
      final sorted = assetCount.sortFn(albums, false);
      expect(
        sorted.isSorted((a, b) => a.assetCount.compareTo(b.assetCount)),
        true,
      );
    });

    test("Asset Count - DESC", () {
      final sorted = assetCount.sortFn(albums, true);
      expect(
        sorted.isSorted((b, a) => a.assetCount.compareTo(b.assetCount)),
        true,
      );
    });
  });

  group("Album sort - Last modified", () {
    const lastModified = AlbumSortMode.lastModified;
    test("Last modified - ASC", () {
      final sorted = lastModified.sortFn(albums, false);
      expect(
        sorted.isSorted((a, b) => a.modifiedAt.compareTo(b.modifiedAt)),
        true,
      );
    });

    test("Last modified - DESC", () {
      final sorted = lastModified.sortFn(albums, true);
      expect(
        sorted.isSorted((b, a) => a.modifiedAt.compareTo(b.modifiedAt)),
        true,
      );
    });
  });

  group("Album sort - Created", () {
    const created = AlbumSortMode.created;
    test("Created - ASC", () {
      final sorted = created.sortFn(albums, false);
      expect(
        sorted.isSorted((a, b) => a.createdAt.compareTo(b.createdAt)),
        true,
      );
    });

    test("Created - DESC", () {
      final sorted = created.sortFn(albums, true);
      expect(
        sorted.isSorted((b, a) => a.createdAt.compareTo(b.createdAt)),
        true,
      );
    });
  });

  group("Album sort - Most Recent", () {
    const mostRecent = AlbumSortMode.mostRecent;

    test("Most Recent - ASC", () {
      final sorted = mostRecent.sortFn(albums, false);
      expect(
        sorted,
        [
          AlbumStub.sharedWithUser,
          AlbumStub.twoAsset,
          AlbumStub.oneAsset,
          AlbumStub.emptyAlbum,
        ],
      );
    });

    test("Most Recent - DESC", () {
      final sorted = mostRecent.sortFn(albums, true);
      expect(
        sorted,
        [
          AlbumStub.emptyAlbum,
          AlbumStub.oneAsset,
          AlbumStub.twoAsset,
          AlbumStub.sharedWithUser,
        ],
      );
    });
  });

  group("Album sort - Most Oldest", () {
    const mostOldest = AlbumSortMode.mostOldest;

    test("Most Oldest - ASC", () {
      final sorted = mostOldest.sortFn(albums, false);
      expect(
        sorted,
        [
          AlbumStub.twoAsset,
          AlbumStub.emptyAlbum,
          AlbumStub.oneAsset,
          AlbumStub.sharedWithUser,
        ],
      );
    });

    test("Most Oldest - DESC", () {
      final sorted = mostOldest.sortFn(albums, true);
      expect(
        sorted,
        [
          AlbumStub.sharedWithUser,
          AlbumStub.oneAsset,
          AlbumStub.emptyAlbum,
          AlbumStub.twoAsset,
        ],
      );
    });
  });
}
