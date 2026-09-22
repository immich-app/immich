import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/services/local_album.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_album.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final backupAlbumProvider = StateNotifierProvider<BackupAlbumNotifier, List<LocalAlbum>>(
  (ref) => BackupAlbumNotifier(LocalAlbumService(ref.watch(driftProvider).localAlbumRepository)),
);

class BackupAlbumNotifier extends StateNotifier<List<LocalAlbum>> {
  BackupAlbumNotifier(this._localAlbumService) : super([]) {
    unawaited(getAll());
  }

  final LocalAlbumService _localAlbumService;

  Future<void> getAll() async {
    state = await _localAlbumService.getAll(sortBy: {SortLocalAlbumsBy.assetCount});
  }

  Future<void> selectAlbum(LocalAlbum album) async {
    final selectedAlbum = album.copyWith(backupSelection: BackupSelection.selected);
    await _localAlbumService.update(selectedAlbum);

    state = state.map((currentAlbum) => currentAlbum.id == selectedAlbum.id ? selectedAlbum : currentAlbum).toList();
  }

  Future<void> deselectAlbum(LocalAlbum album) async {
    final deselectedAlbum = album.copyWith(backupSelection: BackupSelection.none);
    await _localAlbumService.update(deselectedAlbum);

    state = state
        .map((currentAlbum) => currentAlbum.id == deselectedAlbum.id ? deselectedAlbum : currentAlbum)
        .toList();
  }

  Future<void> excludeAlbum(LocalAlbum album) async {
    final excludedAlbum = album.copyWith(backupSelection: BackupSelection.excluded);
    await _localAlbumService.update(excludedAlbum);

    state = state.map((currentAlbum) => currentAlbum.id == excludedAlbum.id ? excludedAlbum : currentAlbum).toList();
  }
}
