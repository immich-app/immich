import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/folder_api.interface.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final folderApiRepositoryProvider = Provider(
  (ref) => FolderApiRepository(
    ref.watch(apiServiceProvider).viewApi,
  ),
);

class FolderApiRepository extends ApiRepository
    implements IFolderApiRepository {
  final ViewApi _api;
  final Logger _log = Logger("FolderApiRepository");

  FolderApiRepository(this._api);

  @override
  Future<AsyncValue<List<String>>> getAllUniquePaths() async {
    try {
      final list = await _api.getUniqueOriginalPaths();
      return list != null ? AsyncData(list) : const AsyncData([]);
    } catch (e, stack) {
      _log.severe("Failed to fetch unique original links", e, stack);
      return AsyncError(e, stack);
    }
  }

  @override
  Future<AsyncValue<List<Asset>>> getAssetsForPath(String? path) async {
    try {
      final list = await _api.getAssetsByOriginalPath(path ?? '/');
      return list != null
          ? AsyncData(list.map(Asset.remote).toList())
          : const AsyncData([]);
    } catch (e, stack) {
      _log.severe("Failed to fetch Assets by original path", e, stack);
      return AsyncError(e, stack);
    }
  }
}
