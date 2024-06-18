import 'package:hooks_riverpod/hooks_riverpod.dart';

import 'package:immich_mobile/services/backup.service.dart';

import 'package:logging/logging.dart';

class BackupNotifier extends StateNotifier<bool> {
  BackupNotifier(
    this._backupService,
  ) : super(
          true,
        );

  final log = Logger('BackupNotifier');
  final BackupService _backupService;
}

final backupProvider = StateNotifierProvider<BackupNotifier, bool>((ref) {
  return BackupNotifier(ref.watch(backupServiceProvider));
});
