import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/folder/root_folder.model.dart';
import 'package:immich_mobile/services/folder.service.dart';

class FoldersNotifier extends StateNotifier<AsyncValue<RootFolder>> {
  final FolderService _folderService;

  FoldersNotifier(this._folderService) : super(const AsyncLoading()) {
    fetchFolders();
  }

  Future<void> fetchFolders() async {
    state = await _folderService.getFolderStructure();
  }
}

final folderStructureProvider =
    StateNotifierProvider<FoldersNotifier, AsyncValue<RootFolder>>((ref) {
  return FoldersNotifier(
    ref.watch(folderServiceProvider),
  );
});
