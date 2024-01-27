import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:logging/logging.dart';
import 'package:openapi/api.dart';

final trashServiceProvider = Provider<TrashService>((ref) {
  return TrashService(
    ref.watch(apiServiceProvider),
  );
});

class TrashService {
  final _log = Logger("TrashService");

  final ApiService _apiService;

  TrashService(this._apiService);

  Future<bool> restoreAssets(Iterable<Asset> assetList) async {
    try {
      List<String> remoteIds =
          assetList.where((a) => a.isRemote).map((e) => e.remoteId!).toList();
      await _apiService.assetApi.restoreAssetsOld(BulkIdsDto(ids: remoteIds));
      return true;
    } catch (error, stack) {
      _log.severe("Cannot restore assets ${error.toString()}", error, stack);
      return false;
    }
  }

  Future<void> emptyTrash() async {
    try {
      await _apiService.assetApi.emptyTrashOld();
    } catch (error, stack) {
      _log.severe("Cannot empty trash ${error.toString()}", error, stack);
    }
  }

  Future<void> restoreTrash() async {
    try {
      await _apiService.assetApi.restoreTrashOld();
    } catch (error, stack) {
      _log.severe("Cannot restore trash ${error.toString()}", error, stack);
    }
  }
}
