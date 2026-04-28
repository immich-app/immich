import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/models/folder/root_folder.model.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';
import 'package:immich_mobile/services/folder.service.dart';
import 'package:logging/logging.dart';

class FolderStructureNotifier extends StateNotifier<AsyncValue<RootFolder>> {
  final FolderService _folderService;
  final Logger _log = Logger("FolderStructureNotifier");
  SortOrder? _lastOrder;

  FolderStructureNotifier(this._folderService) : super(const AsyncLoading());

  Future<void> fetchFolders(SortOrder order) async {
    _lastOrder = order;
    try {
      final folders = await _folderService.getFolderStructure(order);
      state = AsyncData(folders);
    } catch (e, stack) {
      _log.severe("Failed to build folder structure", e, stack);
      state = AsyncError(e, stack);
    }
  }

  Future<void> refresh() async {
    final order = _lastOrder;
    if (order == null) {
      return;
    }
    await fetchFolders(order);
  }
}

final folderStructureProvider = StateNotifierProvider<FolderStructureNotifier, AsyncValue<RootFolder>>((ref) {
  final notifier = FolderStructureNotifier(ref.watch(folderServiceProvider));
  ref.listen<int>(syncStatusProvider.select((state) => state.remoteContentChangedCount), (previous, next) {
    if (previous != null && next != previous) {
      unawaited(notifier.refresh());
    }
  });
  return notifier;
});

class FolderRenderListNotifier extends StateNotifier<AsyncValue<List<RemoteAssetExif>>> {
  final FolderService _folderService;
  final RootFolder _folder;
  final Logger _log = Logger("FolderAssetsNotifier");
  SortOrder? _lastOrder;

  FolderRenderListNotifier(this._folderService, this._folder) : super(const AsyncLoading());

  Future<void> fetchAssets(SortOrder order) async {
    _lastOrder = order;
    try {
      final assets = await _folderService.getFolderAssets(_folder, order);
      state = AsyncData(assets);
    } catch (e, stack) {
      _log.severe("Failed to fetch folder assets", e, stack);
      state = AsyncError(e, stack);
    }
  }

  Future<void> refresh() async {
    final order = _lastOrder;
    if (order == null) {
      return;
    }
    await fetchAssets(order);
  }
}

final folderRenderListProvider =
    StateNotifierProvider.family<FolderRenderListNotifier, AsyncValue<List<RemoteAssetExif>>, RootFolder>((
      ref,
      folder,
    ) {
      final notifier = FolderRenderListNotifier(ref.watch(folderServiceProvider), folder);
      ref.listen<int>(syncStatusProvider.select((state) => state.remoteContentChangedCount), (previous, next) {
        if (previous != null && next != previous) {
          unawaited(notifier.refresh());
        }
      });
      return notifier;
    });
