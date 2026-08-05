import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/services/background_upload.service.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/utils/upload_speed_calculator.dart';
import 'package:mocktail/mocktail.dart';

class MockForegroundUploadService extends Mock implements ForegroundUploadService {}

class MockBackgroundUploadService extends Mock implements BackgroundUploadService {}

void main() {
  late MockForegroundUploadService foregroundUploadService;
  late MockBackgroundUploadService backgroundUploadService;
  late DriftBackupNotifier notifier;

  setUpAll(() {
    registerFallbackValue(Completer<void>());
    registerFallbackValue(const UploadCallbacks());
  });

  setUp(() {
    foregroundUploadService = MockForegroundUploadService();
    backgroundUploadService = MockBackgroundUploadService();
    notifier = DriftBackupNotifier(foregroundUploadService, backgroundUploadService, UploadSpeedManager());
    addTearDown(() {
      if (notifier.mounted) {
        notifier.dispose();
      }
    });
  });

  void mockCounts({required int total, required int remainder, int processing = 0}) {
    when(
      () => foregroundUploadService.getBackupCounts('user-1'),
    ).thenAnswer((_) async => (total: total, remainder: remainder, processing: processing));
  }

  // Drives a backup run so we can grab the onSuccess callback the notifier wires up.
  Future<void Function(String, String)> startAndCaptureOnSuccess() async {
    void Function(String, String)? onSuccess;
    when(() => foregroundUploadService.uploadCandidates(any(), any(), callbacks: any(named: 'callbacks'))).thenAnswer((
      invocation,
    ) async {
      onSuccess = (invocation.namedArguments[#callbacks] as UploadCallbacks).onSuccess;
    });
    await notifier.startForegroundBackup('user-1');
    return onSuccess!;
  }

  group('foreground backup counts', () {
    test('successes move one asset from remainder to backup', () async {
      mockCounts(total: 25, remainder: 25);
      final onSuccess = await startAndCaptureOnSuccess();

      for (var i = 0; i < 10; i++) {
        onSuccess('asset-$i', 'remote-$i');
      }

      expect(notifier.state.remainderCount, 15);
      expect(notifier.state.backupCount, 10);
      expect(notifier.state.backupCount + notifier.state.remainderCount, notifier.state.totalCount);
    });

    test('a duplicate success after pause and resume cannot go below zero', () async {
      // #26215: app pauses mid-backup, sync has not recorded the upload yet, so the
      // resumed run re-uploads the same asset and the server answers 200 duplicate.
      // The start of each run re-baselines the counters from the DB, so the duplicate
      // success is counted against a baseline that includes the asset again.
      mockCounts(total: 1, remainder: 1);

      final firstRun = await startAndCaptureOnSuccess();
      expect(notifier.state.remainderCount, 1);
      firstRun('asset-1', 'remote-1');
      expect(notifier.state.remainderCount, 0);

      notifier.stopForegroundBackup(reason: "test");

      final resumedRun = await startAndCaptureOnSuccess();
      expect(notifier.state.remainderCount, 1);
      verify(() => foregroundUploadService.getBackupCounts('user-1')).called(2);

      resumedRun('asset-1', 'remote-1');
      expect(notifier.state.remainderCount, 0);
      expect(notifier.state.backupCount, 1);
    });

    test('a drifted counter state heals at run start', () async {
      mockCounts(total: 91, remainder: 7);
      notifier.state = notifier.state.copyWith(totalCount: 91, backupCount: 103, remainderCount: -12);

      await startAndCaptureOnSuccess();

      expect(notifier.state.totalCount, 91);
      expect(notifier.state.remainderCount, 7);
      expect(notifier.state.backupCount, 84);
    });

    test('a late success after dispose does not throw', () async {
      mockCounts(total: 2, remainder: 2);
      final onSuccess = await startAndCaptureOnSuccess();
      notifier.dispose();

      onSuccess('asset-1', 'remote-1');
    });
  });
}
