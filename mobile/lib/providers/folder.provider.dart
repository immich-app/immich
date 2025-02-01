import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/models/folder/root_folder.model.dart';
import 'package:immich_mobile/services/folder.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:logging/logging.dart';

class FolderStructureNotifier extends StateNotifier<AsyncValue<RootFolder>> {
  final FolderService _folderService;
  final Logger _log = Logger("FolderStructureNotifier");

  FolderStructureNotifier(this._folderService) : super(const AsyncLoading());

  Future<void> fetchFolders(SortOrder order) async {
    try {
      final folders = await _folderService.getFolderStructure(order);
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

class FolderRenderListNotifier extends StateNotifier<AsyncValue<RenderList>> {
  final FolderService _folderService;
  final RootFolder _folder;
  final Logger _log = Logger("FolderAssetsNotifier");

  FolderRenderListNotifier(this._folderService, this._folder)
      : super(const AsyncLoading());

  Future<void> fetchAssets(SortOrder order) async {
    try {
      final assets = await _folderService.getFolderAssets(_folder, order);
      final renderList =
          await RenderList.fromAssets(assets, GroupAssetsBy.none);
      state = AsyncData(renderList);
    } catch (e, stack) {
      _log.severe("Failed to fetch folder assets", e, stack);
      state = AsyncError(e, stack);
    }
  }
}

final folderRenderListProvider = StateNotifierProvider.family<
    FolderRenderListNotifier,
    AsyncValue<RenderList>,
    RootFolder>((ref, folder) {
  return FolderRenderListNotifier(
    ref.watch(folderServiceProvider),
    folder,
  );
});
