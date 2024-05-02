import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/backup/error_upload_asset.model.dart';

class ErrorBackupListNotifier extends StateNotifier<Set<ErrorUploadAsset>> {
  ErrorBackupListNotifier() : super({});

  add(ErrorUploadAsset errorAsset) {
    state = state.union({errorAsset});
  }

  remove(ErrorUploadAsset errorAsset) {
    state = state.difference({errorAsset});
  }

  empty() {
    state = {};
  }
}

final errorBackupListProvider =
    StateNotifierProvider<ErrorBackupListNotifier, Set<ErrorUploadAsset>>(
  (ref) => ErrorBackupListNotifier(),
);
