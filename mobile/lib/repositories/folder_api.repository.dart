import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/asset_extensions.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/api.repository.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final folderApiRepositoryProvider = Provider((ref) => FolderApiRepository(ref.watch(apiServiceProvider).viewApi));

class FolderApiRepository extends ApiRepository {
  final ViewsApi _api;
  final Logger _log = Logger("FolderApiRepository");

  FolderApiRepository(this._api);

  Future<List<String>> getAllUniquePaths() async {
    try {
      final list = await _api.getUniqueOriginalPaths();
      return list ?? [];
    } catch (e, stack) {
      _log.severe("Failed to fetch unique original links", e, stack);
      return [];
    }
  }

  Future<List<RemoteAssetExif>> getAssetsForPath(String? path) async {
    try {
      final list = await _api.getAssetsByOriginalPath(path ?? '/');
      return list != null ? list.map((e) => e.toDtoWithExif()).toList() : [];
    } catch (e, stack) {
      _log.severe("Failed to fetch Assets by original path", e, stack);
      return [];
    }
  }
}
