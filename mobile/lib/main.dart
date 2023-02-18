import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_displaymode/flutter_displaymode.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/modules/backup/models/hive_backup_albums.model.dart';
import 'package:immich_mobile/modules/backup/models/hive_duplicated_assets.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/login/models/hive_saved_login_info.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/settings/providers/permission.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/routing/tab_navigation_observer.dart';
import 'package:immich_mobile/shared/models/immich_logger_message.model.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/providers/app_state.provider.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/db.provider.dart';
import 'package:immich_mobile/shared/providers/release_info.provider.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:immich_mobile/shared/providers/websocket.provider.dart';
import 'package:immich_mobile/shared/services/immich_logger.service.dart';
import 'package:immich_mobile/shared/views/immich_loading_overlay.dart';
import 'package:immich_mobile/shared/views/version_announcement_overlay.dart';
import 'package:immich_mobile/utils/immich_app_theme.dart';
import 'package:immich_mobile/utils/migration.dart';
import 'package:isar/isar.dart';
import 'package:path_provider/path_provider.dart';
import 'constants/hive_box.dart';

void main() async {
  await initApp();
  final db = await loadDb();
  await migrateHiveToStoreIfNecessary();
  runApp(getMainWidget(db));
}

Future<void> openBoxes() async {
  await Future.wait([
    Hive.openBox<ImmichLoggerMessage>(immichLoggerBox),
    Hive.openBox(userInfoBox),
    Hive.openBox<HiveSavedLoginInfo>(hiveLoginInfoBox),
    Hive.openBox(hiveGithubReleaseInfoBox),
    Hive.openBox(userSettingInfoBox),
    EasyLocalization.ensureInitialized(),
  ]);
}

Future<void> initApp() async {
  await Hive.initFlutter();
  Hive.registerAdapter(HiveSavedLoginInfoAdapter());
  Hive.registerAdapter(HiveBackupAlbumsAdapter());
  Hive.registerAdapter(HiveDuplicatedAssetsAdapter());
  Hive.registerAdapter(ImmichLoggerMessageAdapter());

  await openBoxes();

  if (kReleaseMode && Platform.isAndroid) {
    try {
      await FlutterDisplayMode.setHighRefreshRate();
      debugPrint("Enabled high refresh mode");
    } catch (e) {
      debugPrint("Error setting high refresh rate: $e");
    }
  }

  // Initialize Immich Logger Service
  ImmichLogger().init();
}

Future<Isar> loadDb() async {
  final dir = await getApplicationDocumentsDirectory();
  Isar db = await Isar.open(
    [StoreValueSchema],
    directory: dir.path,
    maxSizeMiB: 256,
  );
  Store.init(db);
  return db;
}

Widget getMainWidget(Isar db) {
  return EasyLocalization(
    supportedLocales: locales,
    path: translationsPath,
    useFallbackTranslations: true,
    fallbackLocale: locales.first,
    child: ProviderScope(
      overrides: [dbProvider.overrideWithValue(db)],
      child: const ImmichApp(),
    ),
  );
}

class ImmichApp extends ConsumerStatefulWidget {
  const ImmichApp({super.key});

  @override
  ImmichAppState createState() => ImmichAppState();
}

class ImmichAppState extends ConsumerState<ImmichApp>
    with WidgetsBindingObserver {
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.resumed:
        debugPrint("[APP STATE] resumed");
        ref.watch(appStateProvider.notifier).state = AppStateEnum.resumed;

        var isAuthenticated = ref.watch(authenticationProvider).isAuthenticated;

        if (isAuthenticated) {
          ref.read(backupProvider.notifier).resumeBackup();
          ref.read(backgroundServiceProvider).resumeServiceIfEnabled();
          ref.watch(assetProvider.notifier).getAllAsset();
          ref.watch(serverInfoProvider.notifier).getServerVersion();
        }

        ref.watch(websocketProvider.notifier).connect();

        ref.watch(releaseInfoProvider.notifier).checkGithubReleaseInfo();

        ref.watch(notificationPermissionProvider.notifier)
          .getNotificationPermission();

        break;

      case AppLifecycleState.inactive:
        debugPrint("[APP STATE] inactive");
        ref.watch(appStateProvider.notifier).state = AppStateEnum.inactive;
        ref.watch(websocketProvider.notifier).disconnect();
        ref.watch(backupProvider.notifier).cancelBackup();

        break;

      case AppLifecycleState.paused:
        debugPrint("[APP STATE] paused");
        ref.watch(appStateProvider.notifier).state = AppStateEnum.paused;
        break;

      case AppLifecycleState.detached:
        debugPrint("[APP STATE] detached");
        ref.watch(appStateProvider.notifier).state = AppStateEnum.detached;
        break;
    }
  }

  Future<void> initApp() async {
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  initState() {
    super.initState();
    initApp().then((_) => debugPrint("App Init Completed"));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // needs to be delayed so that EasyLocalization is working
      ref.read(backgroundServiceProvider).resumeServiceIfEnabled();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    var router = ref.watch(appRouterProvider);
    ref.watch(releaseInfoProvider.notifier).checkGithubReleaseInfo();

    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

    return MaterialApp(
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale,
      debugShowCheckedModeBanner: false,
      home: Stack(
        children: [
          MaterialApp.router(
            title: 'Immich',
            debugShowCheckedModeBanner: false,
            themeMode: ref.watch(immichThemeProvider),
            darkTheme: immichDarkTheme,
            theme: immichLightTheme,
            routeInformationParser: router.defaultRouteParser(),
            routerDelegate: router.delegate(
              navigatorObservers: () => [TabNavigationObserver(ref: ref)],
            ),
          ),
          const ImmichLoadingOverlay(),
          const VersionAnnouncementOverlay(),
        ],
      ),
    );
  }
}
