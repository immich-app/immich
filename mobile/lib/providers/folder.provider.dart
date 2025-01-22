import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/models/folder/root_folder.model.dart';
import 'package:immich_mobile/services/folder.service.dart';
import 'package:logging/logging.dart';

class FolderStructureNotifier extends StateNotifier<AsyncValue<RootFolder>> {
  final FolderService _folderService;
  final Logger _log = Logger("FolderStructureNotifier");

  FolderStructureNotifier(this._folderService) : super(const AsyncLoading());

  Future<void> fetchFolders() async {
    try {
      final folders = await _folderService.getFolderStructure();
      state = AsyncData(folders);
    } catch (e, stack) {
      _log.severe("Failed to build folder structure", e, stack);
      state = AsyncError(e, stack);
    }
  }
}

final folderStructureProvider =
    StateNotifierProvider<FolderStructureNotifier, AsyncValue<RootFolder>>(
        (ref) {
  return FolderStructureNotifier(
    ref.watch(folderServiceProvider),
  );
});

class FolderAssetsNotifier extends StateNotifier<AsyncValue<List<Asset>>> {
  final FolderService _folderService;
  final RootFolder _folder;
  final Logger _log = Logger("FolderAssetsNotifier");

  FolderAssetsNotifier(this._folderService, this._folder)
      : super(const AsyncLoading());

  Future<void> fetchAssets() async {
    try {
      final assets = await _folderService.getFolderAssets(_folder);
      state = AsyncData(assets);
    } catch (e, stack) {
      _log.severe("Failed to fetch folder assets", e, stack);
      state = AsyncError(e, stack);
    }
  }
}

final folderAssetsProvider = StateNotifierProvider.family<FolderAssetsNotifier,
    AsyncValue<List<Asset>>, RootFolder>((ref, folder) {
  return FolderAssetsNotifier(
    ref.watch(folderServiceProvider),
    folder,
  );
});
