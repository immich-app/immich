import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/modules/album/providers/local_album_service.provider.dart';
import 'package:immich_mobile/modules/backup/providers/backup_album.provider.dart';
import 'package:immich_mobile/modules/backup/providers/device_assets.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:isar/isar.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'local_album.provider.g.dart';

@riverpod
class LocalAlbums extends _$LocalAlbums {
  @override
  Stream<List<LocalAlbum>> build() async* {
    final db = ref.read(dbProvider);
    final stream =
        db.localAlbums.where().watch().listen((v) => state = AsyncData(v));
    ref.onDispose(() => stream.cancel());
    yield await db.localAlbums.where().findAll();
  }

  Future<void> getDeviceAlbums() async {
    final hasChanges =
        await ref.read(localAlbumServiceProvider).refreshDeviceAlbums();
    if (hasChanges) {
      ref.read(backupAlbumsProvider.notifier).refreshAlbumAssetsState();
      ref.invalidate(deviceAssetsProvider);
    }
  }
}
