import 'package:immich_mobile/modules/album/models/album.model.dart';
import 'package:immich_mobile/modules/album/providers/local_album_service.provider.dart';
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

  Future<void> getDeviceAlbums() =>
      ref.read(localAlbumServiceProvider).refreshDeviceAlbums();
}
