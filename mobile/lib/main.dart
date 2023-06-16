import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_displaymode/flutter_displaymode.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/modules/backup/models/backup_album.model.dart';
import 'package:immich_mobile/modules/backup/models/duplicated_asset.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/backup/providers/ios_background_settings.provider.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/modules/onboarding/providers/gallery_permission.provider.dart';
import 'package:immich_mobile/modules/settings/providers/notification_permission.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/routing/tab_navigation_observer.dart';
import 'package:immich_mobile/shared/models/album.dart';
import 'package:immich_mobile/shared/models/android_device_asset.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/models/etag.dart';
import 'package:immich_mobile/shared/models/exif_info.dart';
import 'package:immich_mobile/shared/models/ios_device_asset.dart';
import 'package:immich_mobile/shared/models/logger_message.model.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:immich_mobile/shared/models/user.dart';
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
import 'package:logging/logging.dart';
import 'package:path_provider/path_provider.dart';
import 'package:permission_handler/permission_handler.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final db = await loadDb();
  await initApp();
  await migrateDatabaseIfNeeded(db);
  runApp(getMainWidget(db));
}

Future<void> initApp() async {
  await EasyLocalization.ensureInitialized();

  if (kReleaseMode && Platform.isAndroid) {
    try {
      await FlutterDisplayMode.setHighRefreshRate();
      debugPrint("Enabled high refresh mode");
    } catch (e) {
      debugPrint("Error setting high refresh rate: $e");
    }
  }

  // Initialize Immich Logger Service
  ImmichLogger();

  var log = Logger("ImmichErrorLogger");

  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    log.severe(details.toString(), details, details.stack);
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    log.severe(error.toString(), error, stack);
    return true;
  };
}

Future<Isar> loadDb() async {
  final dir = await getApplicationDocumentsDirectory();
  Isar db = await Isar.open(
    [
      StoreValueSchema,
      ExifInfoSchema,
      AssetSchema,
      AlbumSchema,
      UserSchema,
      BackupAlbumSchema,
      DuplicatedAssetSchema,
      LoggerMessageSchema,
      ETagSchema,
      Platform.isAndroid ? AndroidDeviceAssetSchema : IOSDeviceAssetSchema,
    ],
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
        final permission = ref.watch(galleryPermissionNotifier);

        // Needs to be logged in and have gallery permissions
        if (isAuthenticated && (permission.isGranted || permission.isLimited)) {
          ref.read(backupProvider.notifier).resumeBackup();
          ref.read(backgroundServiceProvider).resumeServiceIfEnabled();
          ref.watch(assetProvider.notifier).getAllAsset();
          ref.watch(serverInfoProvider.notifier).getServerVersion();
        }

        ref.watch(websocketProvider.notifier).connect();

        ref.watch(releaseInfoProvider.notifier).checkGithubReleaseInfo();

        ref
            .watch(notificationPermissionProvider.notifier)
            .getNotificationPermission();
        ref
            .watch(galleryPermissionNotifier.notifier)
            .getGalleryPermissionStatus();

        ref.read(iOSBackgroundSettingsProvider.notifier).refresh();

        break;

      case AppLifecycleState.inactive:
        debugPrint("[APP STATE] inactive");
        ref.watch(appStateProvider.notifier).state = AppStateEnum.inactive;
        ImmichLogger().flush();
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

    // Draw the app from edge to edge
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);

    // Sets the navigation bar color
    SystemUiOverlayStyle overlayStyle = const SystemUiOverlayStyle(
      systemNavigationBarColor: Colors.transparent,
    );
    if (Platform.isAndroid) {
      // Android 8 does not support transparent app bars
      final info = await DeviceInfoPlugin().androidInfo;
      if (info.version.sdkInt <= 26) {
        overlayStyle =
            MediaQuery.of(context).platformBrightness == Brightness.light
                ? SystemUiOverlayStyle.light
                : SystemUiOverlayStyle.dark;
      }
    }
    SystemChrome.setSystemUIOverlayStyle(overlayStyle);
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
