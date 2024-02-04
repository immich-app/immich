import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/modules/home/ui/asset_grid/asset_grid_data_structure.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/utils/renderlist_generator.dart';

final remoteAlbumWatcher =
    StreamProvider.autoDispose.family<RemoteAlbum, int>((ref, albumId) async* {
  final db = ref.watch(dbProvider);
  final a = await db.remoteAlbums.get(albumId);
  if (a != null) yield a;
  await for (final a
      in db.remoteAlbums.watchObject(albumId, fireImmediately: true)) {
    if (a != null) yield a;
  }
});

final remoteAlbumRenderlistProvider =
    StreamProvider.autoDispose.family<RenderList, int>((ref, albumId) {
  final album = ref.watch(remoteAlbumWatcher(albumId)).value;
  if (album != null) {
    final query =
        album.assets.filter().isTrashedEqualTo(false).sortByFileCreatedAtDesc();
    return renderListGeneratorWithGroupBy(query, GroupAssetsBy.none);
  }
  return const Stream.empty();
});

final localAlbumWatcher =
    StreamProvider.autoDispose.family<LocalAlbum, int>((ref, albumId) async* {
  final db = ref.watch(dbProvider);
  final a = await db.localAlbums.get(albumId);
  if (a != null) yield a;
  await for (final a
      in db.localAlbums.watchObject(albumId, fireImmediately: true)) {
    if (a != null) yield a;
  }
});

final localAlbumRenderlistProvider =
    StreamProvider.autoDispose.family<RenderList, int>((ref, albumId) {
  final album = ref.watch(localAlbumWatcher(albumId)).value;
  if (album != null) {
    final query =
        album.assets.filter().localIdIsNotNull().sortByFileCreatedAtDesc();
    return renderListGeneratorWithGroupBy(query, GroupAssetsBy.none);
  }
  return const Stream.empty();
});
