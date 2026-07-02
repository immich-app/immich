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

  Future<void> seedCounts({required int total, required int remainder, int processing = 0}) async {
    when(
      () => foregroundUploadService.getBackupCounts('user-1'),
    ).thenAnswer((_) async => (total: total, remainder: remainder, processing: processing));
    await notifier.getBackupStatus('user-1');
  }

  // Drives a real backup so we can grab the onSuccess callback the notifier wires up.
  Future<void Function(String, String)> startAndCaptureOnSuccess() async {
    void Function(String, String)? onSuccess;
    when(
      () => foregroundUploadService.uploadCandidates(any(), any(), callbacks: any(named: 'callbacks')),
    ).thenAnswer((invocation) async {
      onSuccess = (invocation.namedArguments[#callbacks] as UploadCallbacks).onSuccess;
    });
    await notifier.startForegroundBackup('user-1');
    return onSuccess!;
  }

  group('foreground backup counts', () {
    test('moves one asset from remainder to backup on each success', () async {
      await seedCounts(total: 25, remainder: 25);
      final onSuccess = await startAndCaptureOnSuccess();

      for (var i = 0; i < 10; i++) {
        onSuccess('asset-$i', 'remote-$i');
      }

      expect(notifier.state.remainderCount, 15);
      expect(notifier.state.backupCount, 10);
      expect(notifier.state.backupCount + notifier.state.remainderCount, notifier.state.totalCount);
    });

    test('keeps remainder at zero and backup at total when duplicates re-fire success', () async {
      // Reproduces #26215: a lossy sync never records the uploads locally, so the
      // app re-uploads them, the server answers 200 (duplicate) and onSuccess fires
      // again. 25 real + 15 duplicate successes must not push the counts past their bounds.
      await seedCounts(total: 25, remainder: 25);
      final onSuccess = await startAndCaptureOnSuccess();

      for (var i = 0; i < 40; i++) {
        onSuccess('asset-${i % 25}', 'remote-${i % 25}');
      }

      expect(notifier.state.remainderCount, 0);
      expect(notifier.state.backupCount, 25);
      expect(notifier.state.backupCount, lessThanOrEqualTo(notifier.state.totalCount));
    });

    test('a refreshed status stays authoritative after duplicates drove the count down', () async {
      await seedCounts(total: 25, remainder: 25);
      final onSuccess = await startAndCaptureOnSuccess();
      for (var i = 0; i < 40; i++) {
        onSuccess('asset-${i % 25}', 'remote-${i % 25}');
      }

      await seedCounts(total: 25, remainder: 25);

      expect(notifier.state.remainderCount, 25);
      expect(notifier.state.backupCount, 0);
    });

    test('ignores a success that arrives after the notifier is disposed', () async {
      await seedCounts(total: 25, remainder: 25);
      final onSuccess = await startAndCaptureOnSuccess();
      notifier.dispose();

      expect(() => onSuccess('asset-late', 'remote-late'), returnsNormally);
    });
  });
}
