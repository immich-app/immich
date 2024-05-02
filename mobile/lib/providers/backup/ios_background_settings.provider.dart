import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/background.service.dart';

class IOSBackgroundSettings {
  final bool appRefreshEnabled;
  final int numberOfBackgroundTasksQueued;
  final DateTime? timeOfLastFetch;
  final DateTime? timeOfLastProcessing;

  IOSBackgroundSettings({
    required this.appRefreshEnabled,
    required this.numberOfBackgroundTasksQueued,
    this.timeOfLastFetch,
    this.timeOfLastProcessing,
  });
}

class IOSBackgroundSettingsNotifier
    extends StateNotifier<IOSBackgroundSettings?> {
  final BackgroundService _service;
  IOSBackgroundSettingsNotifier(this._service) : super(null);

  IOSBackgroundSettings? get settings => state;

  Future<IOSBackgroundSettings> refresh() async {
    final lastFetchTime =
        await _service.getIOSBackupLastRun(IosBackgroundTask.fetch);
    final lastProcessingTime =
        await _service.getIOSBackupLastRun(IosBackgroundTask.processing);
    int numberOfProcesses = await _service.getIOSBackupNumberOfProcesses();
    final appRefreshEnabled =
        await _service.getIOSBackgroundAppRefreshEnabled();

    // If this is enabled and there are no background processes,
    // the user just enabled app refresh in Settings.
    // But we don't have any background services running, since it was disabled
    // before.
    if (await _service.isBackgroundBackupEnabled() && numberOfProcesses == 0) {
      // We need to restart the background service
      await _service.enableService();
      numberOfProcesses = await _service.getIOSBackupNumberOfProcesses();
    }

    final settings = IOSBackgroundSettings(
      appRefreshEnabled: appRefreshEnabled,
      numberOfBackgroundTasksQueued: numberOfProcesses,
      timeOfLastFetch: lastFetchTime,
      timeOfLastProcessing: lastProcessingTime,
    );

    state = settings;
    return settings;
  }
}

final iOSBackgroundSettingsProvider = StateNotifierProvider<
    IOSBackgroundSettingsNotifier, IOSBackgroundSettings?>(
  (ref) => IOSBackgroundSettingsNotifier(ref.watch(backgroundServiceProvider)),
);
