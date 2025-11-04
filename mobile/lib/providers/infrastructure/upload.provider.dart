import 'dart:async';

import 'package:background_downloader/background_downloader.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset_upload.repository.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:logging/logging.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

class UploadTimerNotifier extends Notifier<bool> {
  Timer? _timer;
  final _timerLogger = Logger('UploadTimer');
  static const _refreshDuration = Duration(seconds: 45);

  void start() {
    if (state) {
      return;
    }

    state = true;
    _schedule();
  }

  void stop() {
    if (!state) {
      return;
    }

    _timer?.cancel();
    _timer = null;
    state = false;
  }

  void _schedule() {
    _timer?.cancel();
    _timer = Timer(_refreshDuration, () async {
      if (!state) {
        return;
      }
      await _backup();
      if (state) {
        _schedule();
      }
    });
  }

  Future<void> _backup() async {
    final isBackupEnabled = ref.read(appSettingsServiceProvider).getSetting(AppSettingsEnum.enableBackup);
    if (!isBackupEnabled) {
      _timerLogger.fine("UploadTimer: Backup is disabled, skipping backup start.");
      return;
    }

    final tasks = await FileDownloader().allTasks(group: kBackupGroup);
    final currentUserId = ref.read(currentUserProvider)?.id;
    if (tasks.isEmpty && currentUserId != null) {
      await ref.read(driftBackupProvider.notifier).startBackup(currentUserId);
    } else {
      _timerLogger.fine("UploadTimer: There are still active upload tasks - ${tasks.length}, skipping backup start.");
    }
  }

  @override
  bool build() {
    Future.microtask(start);
    ref.onDispose(() {
      _timer?.cancel();
    });
    // Timer is not running yet
    return false;
  }
}

final uploadTimerProvider = NotifierProvider<UploadTimerNotifier, bool>(UploadTimerNotifier.new);

final assetUploadRepositoryProvider = Provider<DriftLocalAssetUploadRepository>(
  (ref) => DriftLocalAssetUploadRepository(ref.watch(driftProvider)),
);
