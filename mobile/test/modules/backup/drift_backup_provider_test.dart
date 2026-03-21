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
  late MockForegroundUploadService mockForegroundUploadService;
  late MockBackgroundUploadService mockBackgroundUploadService;
  late DriftBackupNotifier notifier;

  setUpAll(() {
    registerFallbackValue(const UploadCallbacks());
    registerFallbackValue(Completer<void>());
  });

  setUp(() {
    mockForegroundUploadService = MockForegroundUploadService();
    mockBackgroundUploadService = MockBackgroundUploadService();
    notifier = DriftBackupNotifier(
      mockForegroundUploadService,
      mockBackgroundUploadService,
      UploadSpeedManager(),
    );
  });

  group('DriftBackupNotifier', () {
    test('startForegroundBackup ignores duplicate start while upload is active', () async {
      final uploadCompleter = Completer<void>();

      when(
        () => mockForegroundUploadService.uploadCandidates(
          any(),
          any(),
          callbacks: any(named: 'callbacks'),
        ),
      ).thenAnswer((_) => uploadCompleter.future);

      final firstRun = notifier.startForegroundBackup('user-id');
      await Future<void>.delayed(Duration.zero);

      await notifier.startForegroundBackup('user-id');

      verify(
        () => mockForegroundUploadService.uploadCandidates(
          'user-id',
          any(),
          callbacks: any(named: 'callbacks'),
        ),
      ).called(1);

      uploadCompleter.complete();
      await firstRun;
    });
  });
}
