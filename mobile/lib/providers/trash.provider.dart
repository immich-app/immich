import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/trash.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:logging/logging.dart';

class TrashNotifier extends StateNotifier<bool> {
  final TrashService _trashService;
  final _log = Logger('TrashNotifier');

  TrashNotifier(
    this._trashService,
  ) : super(false);

  Future<void> emptyTrash() async {
    try {
      await _trashService.emptyTrash();
      state = true;
    } catch (error, stack) {
      _log.severe("Cannot empty trash", error, stack);
      state = false;
    }
  }

  Future<bool> restoreAssets(Iterable<Asset> assetList) async {
    try {
      await _trashService.restoreAssets(assetList);
      return true;
    } catch (error, stack) {
      _log.severe("Cannot restore assets", error, stack);
      return false;
    }
  }

  Future<void> restoreTrash() async {
    try {
      await _trashService.restoreTrash();
      state = true;
    } catch (error, stack) {
      _log.severe("Cannot restore trash", error, stack);
      state = false;
    }
  }
}

final trashProvider = StateNotifierProvider<TrashNotifier, bool>((ref) {
  return TrashNotifier(
    ref.watch(trashServiceProvider),
  );
});
