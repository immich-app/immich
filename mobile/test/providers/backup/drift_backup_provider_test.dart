import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/services/background_upload.service.dart';
import 'package:immich_mobile/services/foreground_upload.service.dart';
import 'package:immich_mobile/utils/upload_speed_calculator.dart';
import 'package:mocktail/mocktail.dart';

class MockForegroundUploadService extends Mock
    implements ForegroundUploadService {}

class MockBackgroundUploadService extends Mock
    implements BackgroundUploadService {}

void main() {
  late DriftBackupNotifier sut;
  late MockForegroundUploadService mockForegroundService;
  late MockBackgroundUploadService mockBackgroundService;

  setUpAll(() {
    registerFallbackValue(Completer<void>());
    registerFallbackValue(const UploadCallbacks());
  });

  setUp(() {
    mockForegroundService = MockForegroundUploadService();
    mockBackgroundService = MockBackgroundUploadService();
    sut = DriftBackupNotifier(
      mockForegroundService,
      mockBackgroundService,
      UploadSpeedManager(),
    );
  });

  tearDown(() {
    sut.dispose();
  });

  group('_handleForegroundBackupSuccess', () {
    test(
      'remainderCount should not go negative when getBackupStatus refreshes before success callback',
      () async {
        const userId = 'test-user';


        when(() => mockForegroundService.getBackupCounts(userId)).thenAnswer(
          (_) async => (total: 5, remainder: 1, processing: 0),
        );
        await sut.getBackupStatus(userId);
        expect(sut.state.remainderCount, 1);


        late void Function(String localId) onSuccess;
        when(
          () => mockForegroundService.uploadCandidates(
            any(),
            any(),
            callbacks: any(named: 'callbacks'),
            useSequentialUpload: any(named: 'useSequentialUpload'),
          ),
        ).thenAnswer((invocation) async {
          final callbacks =
              invocation.namedArguments[#callbacks] as UploadCallbacks;
          onSuccess = callbacks.onSuccess!;
        });

        await sut.startForegroundBackup(userId);

        when(() => mockForegroundService.getBackupCounts(userId)).thenAnswer(
          (_) async => (total: 5, remainder: 0, processing: 0),
        );
        await sut.getBackupStatus(userId);
        expect(sut.state.remainderCount, 0);

        onSuccess('asset-1');

        await Future<void>.delayed(Duration.zero);

        expect(sut.state.remainderCount, greaterThanOrEqualTo(0));
      },
    );
  });
}
