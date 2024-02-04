import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/modules/album/services/album.service.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'remote_album.provider.g.dart';

@riverpod
class RemoteAlbums extends _$RemoteAlbums {
  @override
  Stream<List<RemoteAlbum>> build() async* {
    final db = ref.read(dbProvider);
    final stream =
        db.remoteAlbums.where().watch().listen((v) => state = AsyncData(v));
    ref.onDispose(() => stream.cancel());
    yield await db.remoteAlbums.where().findAll();
  }

  Future<void> getRemoteAlbums([bool isShared = false]) =>
      ref.read(albumServiceProvider).refreshRemoteAlbums(isShared: isShared);

  Future<bool> deleteAlbum(RemoteAlbum album) =>
      ref.read(albumServiceProvider).deleteAlbum(album);

  Future<RemoteAlbum?> createAlbum(
    String albumTitle,
    Set<Asset> assets,
  ) =>
      ref.read(albumServiceProvider).createAlbum(albumTitle, assets, []);
}
