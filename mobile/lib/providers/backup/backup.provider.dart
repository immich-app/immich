import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/models/backup/backup_state.model.dart';

import 'package:immich_mobile/services/backup.service.dart';

import 'package:logging/logging.dart';

class BackupNotifier extends StateNotifier<BackUpState> {
  BackupNotifier(
    this._backupService,
  ) : super(
          BackUpState(
            progress: BackUpProgressEnum.idle,
            uploadTasks: [],
          ),
        );

  final log = Logger('BackupNotifier');
  final BackupService _backupService;

  Future<void> getBackupCandidates() async {
    state = state.copyWith(
      uploadTasks: await _backupService.getBackupCandidates(),
    );
  }

  Future<void> startBackup() async {
    await _backupService.startBackup(state.uploadTasks);
  }
}

final backupNotifierProvider =
    StateNotifierProvider<BackupNotifier, BackUpState>((ref) {
  return BackupNotifier(ref.watch(backupServiceProvider));
});
