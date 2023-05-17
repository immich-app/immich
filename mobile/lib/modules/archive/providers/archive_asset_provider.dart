import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:isar/isar.dart';

class ArchiveSelectionNotifier extends StateNotifier<Set<int>> {
  ArchiveSelectionNotifier(this.db, this.assetNotifier) : super({}) {
    state = db.assets
        .filter()
        .isArchivedEqualTo(true)
        .findAllSync()
        .map((e) => e.id)
        .toSet();
  }

  final Isar db;
  final AssetNotifier assetNotifier;

  void _setArchiveForAssetId(int id, bool archive) {
    if (!archive) {
      state = state.difference({id});
    } else {
      state = state.union({id});
    }
  }

  bool _isArchive(int id) {
    return state.contains(id);
  }

  Future<void> toggleArchive(Asset asset) async {
    if (asset.storage == AssetState.local) return;

    _setArchiveForAssetId(asset.id, !_isArchive(asset.id));

    await assetNotifier.toggleArchive(
      [asset],
      state.contains(asset.id),
    );
  }

  Future<void> addToArchives(Iterable<Asset> assets) {
    state = state.union(assets.map((a) => a.id).toSet());
    return assetNotifier.toggleArchive(assets, true);
  }
}

final archiveProvider =
    StateNotifierProvider<ArchiveSelectionNotifier, Set<int>>((ref) {
  return ArchiveSelectionNotifier(
    ref.watch(dbProvider),
    ref.watch(assetProvider.notifier),
  );
});
