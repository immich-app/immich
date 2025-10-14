import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/services/local_album.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/providers/infrastructure/album.provider.dart';

final backupAlbumProvider = StateNotifierProvider<BackupAlbumNotifier, List<LocalAlbum>>(
  (ref) => BackupAlbumNotifier(ref.watch(localAlbumServiceProvider)),
);

class BackupAlbumNotifier extends StateNotifier<List<LocalAlbum>> {
  BackupAlbumNotifier(this._localAlbumService) : super([]) {
    getAll();
  }

  final LocalAlbumService _localAlbumService;

  Future<void> getAll() async {
    state = await _localAlbumService.getAll(sortBy: {SortLocalAlbumsBy.assetCount});
  }

  Future<void> selectAlbum(LocalAlbum album) async {
    album = album.copyWith(backupSelection: BackupSelection.selected);
    await _localAlbumService.update(album);

    state = state
        .map(
          (currentAlbum) => currentAlbum.id == album.id
              ? currentAlbum.copyWith(backupSelection: BackupSelection.selected)
              : currentAlbum,
        )
        .toList();
  }

  Future<void> deselectAlbum(LocalAlbum album) async {
    album = album.copyWith(backupSelection: BackupSelection.none);
    await _localAlbumService.update(album);

    state = state
        .map(
          (currentAlbum) =>
              currentAlbum.id == album.id ? currentAlbum.copyWith(backupSelection: BackupSelection.none) : currentAlbum,
        )
        .toList();
  }

  Future<void> excludeAlbum(LocalAlbum album) async {
    album = album.copyWith(backupSelection: BackupSelection.excluded);
    await _localAlbumService.update(album);

    state = state
        .map(
          (currentAlbum) => currentAlbum.id == album.id
              ? currentAlbum.copyWith(backupSelection: BackupSelection.excluded)
              : currentAlbum,
        )
        .toList();
  }
}
