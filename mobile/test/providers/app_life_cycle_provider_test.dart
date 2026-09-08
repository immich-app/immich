import 'dart:async';

import 'package:flutter_test/flutter_test.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/config/app_config.dart';
import 'package:immich_mobile/domain/models/log.model.dart';
import 'package:immich_mobile/domain/services/device_permission.service.dart';
import 'package:immich_mobile/domain/services/log.service.dart';
import 'package:immich_mobile/models/auth/auth_state.model.dart';
import 'package:immich_mobile/models/server_info/server_version.model.dart';
import 'package:immich_mobile/providers/app_life_cycle.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/background_sync.provider.dart';
import 'package:immich_mobile/providers/backup/backup.provider.dart';
import 'package:immich_mobile/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/providers/infrastructure/memory.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/permission.provider.dart';
import 'package:immich_mobile/providers/server_info.provider.dart';
import 'package:immich_mobile/providers/websocket.provider.dart';
import 'package:immich_mobile/utils/upload_speed_calculator.dart';
import 'package:mocktail/mocktail.dart';
import 'package:permission_handler/permission_handler.dart';

import '../infrastructure/repository.mock.dart';
import '../repository.mocks.dart';
import '../service.mocks.dart';

class FakeLogMessage extends Fake implements LogMessage {}

class TestAuthNotifier extends AuthNotifier {
  TestAuthNotifier(Ref ref)
    : super(
        MockAuthService(),
        MockApiService(),
        MockUserService(),
        MockSecureStorageService(),
        MockWidgetService(),
        ref,
      ) {
    state = const AuthState(
      deviceId: 'device-1',
      userId: 'user-1',
      userEmail: 'user@example.com',
      name: 'User',
      profileImagePath: '',
      isAdmin: false,
      isAuthenticated: true,
    );
  }

  @override
  Future<String?> setOpenApiServiceEndpoint() async => 'http://test-server.com';
}

class TestWebsocketNotifier extends WebsocketNotifier {
  TestWebsocketNotifier(super.ref);

  int connectCount = 0;
  int disconnectCount = 0;
  bool throwOnConnect = true;
  final connectCalled = Completer<void>();

  @override
  void connect() {
    connectCount++;
    if (!connectCalled.isCompleted) {
      connectCalled.complete();
    }
    if (throwOnConnect) {
      throw StateError('unexpected websocket connection');
    }
  }

  @override
  void disconnect() => disconnectCount++;
}

class TestDriftBackupNotifier extends BackupNotifier {
  TestDriftBackupNotifier() : super(MockForegroundUploadService(), MockBackgroundUploadService(), UploadSpeedManager());
}

class TestNotificationPermissionNotifier extends NotificationPermissionNotifier {
  @override
  Future<PermissionStatus> getNotificationPermission() async => state;
}

class TestGalleryPermissionNotifier extends GalleryPermissionNotifier {
  TestGalleryPermissionNotifier() : super(DevicePermissionService(MockPermissionRepository()));

  @override
  Future<DevicePermissionStatus> getGalleryPermissionStatus() async => state;
}

void main() {
  late LogService logService;
  late Completer<ServerVersion?> serverVersion;
  late MockServerInfoService serverInfoService;
  late MockBackgroundWorkerLockService lockService;
  late ProviderContainer container;
  late TestWebsocketNotifier websocket;
  late AppLifeCycleNotifier lifeCycle;
  late int serverVersionCount;
  late int memoryLaneBuilds;

  setUpAll(() async {
    final logRepository = MockLogRepository();
    final settingsRepository = MockSettingsRepository();
    registerFallbackValue(FakeLogMessage());
    when(() => logRepository.truncate(limit: any(named: 'limit'))).thenAnswer((_) async {});
    when(() => logRepository.insert(any())).thenAnswer((_) async => true);
    when(() => settingsRepository.appConfig).thenReturn(const AppConfig(logLevel: LogLevel.info));
    logService = await LogService.init(
      logRepository: logRepository,
      settingsRepository: settingsRepository,
      shouldBuffer: false,
    );
  });

  tearDownAll(() => logService.dispose());

  setUp(() {
    serverVersion = Completer<ServerVersion?>();
    serverInfoService = MockServerInfoService();
    lockService = MockBackgroundWorkerLockService();
    final backgroundSync = MockBackgroundSyncManager();
    serverVersionCount = 0;
    memoryLaneBuilds = 0;

    when(() => serverInfoService.getServerVersion()).thenAnswer((_) {
      serverVersionCount++;
      return serverVersionCount == 1 ? serverVersion.future : Future<ServerVersion?>.value();
    });
    when(() => lockService.lock()).thenAnswer((_) async {});
    when(() => lockService.unlock()).thenAnswer((_) async {});
    when(() => backgroundSync.cancelResumeSyncs()).thenAnswer((_) async {});
    when(() => backgroundSync.syncLocal(full: any(named: 'full'))).thenAnswer((_) async {});
    when(() => backgroundSync.syncRemote()).thenAnswer((_) async => true);
    when(() => backgroundSync.hashAssets()).thenAnswer((_) async {});

    container = ProviderContainer(
      overrides: [
        authProvider.overrideWith(TestAuthNotifier.new),
        serverInfoProvider.overrideWith((_) => ServerInfoNotifier(serverInfoService)),
        websocketProvider.overrideWith((ref) {
          return websocket = TestWebsocketNotifier(ref);
        }),
        backupProvider.overrideWith((_) => TestDriftBackupNotifier()),
        backgroundWorkerLockServiceProvider.overrideWithValue(lockService),
        backgroundSyncProvider.overrideWithValue(backgroundSync),
        appConfigProvider.overrideWithValue(defaultConfig),
        notificationPermissionProvider.overrideWith((_) => TestNotificationPermissionNotifier()),
        galleryPermissionNotifier.overrideWith((_) => TestGalleryPermissionNotifier()),
        memoryLaneProvider.overrideWith((_) {
          memoryLaneBuilds++;
          return const [];
        }),
      ],
    );
    lifeCycle = container.read(appStateProvider.notifier);
  });

  tearDown(() => container.dispose());

  Future<void> startResume() async {
    await lifeCycle.handleAppPause();
    unawaited(lifeCycle.handleAppResume());
    await untilCalled(() => serverInfoService.getServerVersion());
  }

  Future<void> releaseResume() async {
    serverVersion.complete();
    await Future<void>.delayed(Duration.zero);
  }

  test('pause during resume does not reconnect websocket', () async {
    await startResume();
    await lifeCycle.handleAppPause();
    await releaseResume();

    expect(lifeCycle.getAppState(), AppLifeCycleEnum.paused);
    expect(serverVersionCount, 1);
    expect(websocket.disconnectCount, 2);
    expect(websocket.connectCount, 0);
  });

  test('inactive resume retries when the app resumes again', () async {
    await startResume();
    lifeCycle.handleAppInactivity();
    await releaseResume();

    unawaited(lifeCycle.handleAppResume());
    await websocket.connectCalled.future;

    expect(lifeCycle.getAppState(), AppLifeCycleEnum.resumed);
    expect(serverVersionCount, 2);
    expect(websocket.disconnectCount, 1);
    expect(websocket.connectCount, 1);
  });

  test('pause after an inactive abort resumes once', () async {
    await startResume();
    lifeCycle.handleAppInactivity();
    await releaseResume();
    await lifeCycle.handleAppPause();

    unawaited(lifeCycle.handleAppResume());
    await websocket.connectCalled.future;
    unawaited(lifeCycle.handleAppResume());
    await Future<void>.delayed(Duration.zero);

    expect(lifeCycle.getAppState(), AppLifeCycleEnum.resumed);
    expect(serverVersionCount, 2);
    expect(websocket.disconnectCount, 2);
    expect(websocket.connectCount, 1);
  });

  test('resume re-queries the memory lane', () async {
    container.listen(memoryLaneProvider, (_, _) {});
    expect(memoryLaneBuilds, 1);

    await lifeCycle.handleAppPause();
    websocket.throwOnConnect = false;
    serverVersion.complete();
    await lifeCycle.handleAppResume();
    await Future<void>.delayed(Duration.zero);

    expect(memoryLaneBuilds, 2);
  });
}
