import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/models/folder/root_folder.model.dart';
import 'package:immich_mobile/services/folder.service.dart';
import 'package:immich_mobile/widgets/asset_grid/asset_grid_data_structure.dart';
import 'package:logging/logging.dart';

class FolderStructureNotifier extends StateNotifier<AsyncValue<RootFolder>> {
  final FolderService _folderService;
  final Logger _log = Logger("FolderStructureNotifier");

  var sortOrder = SortOrder.asc;

  FolderStructureNotifier(this._folderService) : super(const AsyncLoading());

  Future<void> fetchFolders() async {
    try {
      final folders = await _folderService.getFolderStructure(sortOrder);
      state = AsyncData(folders);
    } catch (e, stack) {
      _log.severe("Failed to build folder structure", e, stack);
      state = AsyncError(e, stack);
    }
  }

  Future<void> toggleSortOrder() {
    sortOrder = sortOrder == SortOrder.asc ? SortOrder.desc : SortOrder.asc;
    return fetchFolders();
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

  var sortOrder = SortOrder.asc;

  FolderRenderListNotifier(this._folderService, this._folder)
      : super(const AsyncLoading());

  Future<void> fetchAssets() async {
    try {
      final assets = await _folderService.getFolderAssets(_folder, sortOrder);

      state =
          AsyncData(await RenderList.fromAssets(assets, GroupAssetsBy.none));
    } catch (e, stack) {
      _log.severe("Failed to fetch folder assets", e, stack);
      state = AsyncError(e, stack);
    }
  }

  Future<void> toggleSortOrder() {
    sortOrder = sortOrder == SortOrder.asc ? SortOrder.desc : SortOrder.asc;
    return fetchAssets();
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
