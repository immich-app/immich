import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/album/local_album.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/utils/background_sync.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/infrastructure/entities/user.entity.dart';
import 'package:immich_mobile/pages/backup/drift_backup.page.dart';
import 'package:immich_mobile/presentation/widgets/backup/backup_toggle_button.widget.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/backup_album.provider.dart';
import 'package:immich_mobile/providers/backup/drift_backup.provider.dart';
import 'package:immich_mobile/providers/sync_status.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:mocktail/mocktail.dart';

import '../../../test_utils.dart';
import '../../../widget_tester_extensions.dart';

class MockDriftBackupNotifier extends StateNotifier<DriftBackupState>
    with Mock
    implements DriftBackupNotifier {
  MockDriftBackupNotifier()
      : super(
          const DriftBackupState(
            totalCount: 100,
            backupCount: 50,
            remainderCount: 50,
            processingCount: 0,
            isSyncing: false,
            uploadItems: {},
            error: BackupError.none,
          ),
        );
}

class MockBackgroundSyncManager extends Mock implements BackgroundSyncManager {}

void main() {
  late MockDriftBackupNotifier mockBackupNotifier;
  late MockBackgroundSyncManager mockBackgroundSyncManager;
  late User user;
  
  // Create a selected album to ensure the backup UI (and toggle button) is shown
  final selectedAlbum = LocalAlbum(
    id: 'album_1',
    name: 'Camera',
    updatedAt: DateTime.now(),
    backupSelection: BackupSelection.selected,
  );

  setUpAll(() {
    TestUtils.init();
    registerFallbackValue(BackupError.none);
  });

  setUp(() {
    mockBackupNotifier = MockDriftBackupNotifier();
    mockBackgroundSyncManager = MockBackgroundSyncManager();
    user = User(
      id: 'user_1',
      updatedAt: DateTime.now(),
      createdAt: DateTime.now(),
      email: 'test@example.com',
      name: 'Test User',
      profileImagePath: '',
      isAdmin: false,
      isPartnerSharedWith: false,
      shouldChangePassword: false,
      status: 'active',
      deletedAt: null,
      quotaSizeInBytes: 0,
      quotaUsageInBytes: 0,
      memoryEnabled: true,
      oauthId: '',
      profileColor: '',
    );
    
    // Setup default mock behaviors
    when(() => mockBackupNotifier.getBackupStatus(any())).thenAnswer((_) async {});
    when(() => mockBackupNotifier.updateSyncing(any())).thenReturn(null);
    when(() => mockBackupNotifier.stopForegroundBackup()).thenAnswer((_) async {});
    when(() => mockBackupNotifier.startForegroundBackup(any())).thenAnswer((_) async {});
    
    // Store mock
    Store.init(StoreKey.currentUser, user);
  });

  testWidgets(
      'shows confirmation dialog when stopping backup and stops only on confirm',
      (tester) async {
    when(() => mockBackgroundSyncManager.syncRemote()).thenAnswer((_) async => true);

    await tester.pumpConsumerWidget(
      const DriftBackupPage(),
      overrides: [
        currentUserProvider.overrideWith((ref) => user),
        driftBackupProvider.overrideWith((ref) => mockBackupNotifier),
        backgroundSyncProvider.overrideWithValue(mockBackgroundSyncManager),
        backupAlbumProvider.overrideWith((ref) => [selectedAlbum]),
        syncStatusProvider.overrideWith((ref) => SyncStatusState()),
      ],
    );
    
    await tester.pumpAndSettle();

    // Verify BackupToggleButton is present
    final toggleButtonFinder = find.byType(BackupToggleButton);
    expect(toggleButtonFinder, findsOneWidget);
    
    // Scroll to the button to make sure it's visible (it's in a ListView)
    await tester.scrollUntilVisible(toggleButtonFinder, 100);
    await tester.pumpAndSettle();
    
    // Tap the button to stop backup
    await tester.tap(toggleButtonFinder);
    await tester.pumpAndSettle();
    
    // Verify confirmation dialog appears
    expect(find.byType(AlertDialog), findsOneWidget);
    expect(find.text("backup_controller_page_stop_backup_dialog_title"), findsOneWidget);
    
    // Tap Cancel
    await tester.tap(find.text("cancel"));
    await tester.pumpAndSettle();
    
    // Verify dialog closed and stopForegroundBackup was NOT called
    expect(find.byType(AlertDialog), findsNothing);
    verifyNever(() => mockBackupNotifier.stopForegroundBackup());
    
    // Tap button again
    await tester.tap(toggleButtonFinder);
    await tester.pumpAndSettle();
    
    // Setup expect for stopForegroundBackup
    // (Verification happens after action)
    
    // Tap Confirm
    await tester.tap(find.text("confirm"));
    await tester.pumpAndSettle();
    
    // Verify stopForegroundBackup WAS called
    verify(() => mockBackupNotifier.stopForegroundBackup()).called(1);
  });
}
