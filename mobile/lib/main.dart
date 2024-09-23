import 'dart:async';
import 'dart:io';

import 'package:background_downloader/background_downloader.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_displaymode/flutter_displaymode.dart';
import 'package:flutter_hooks/flutter_hooks.dart' as hooks;
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/utils/immich_loading_overlay.dart';
import 'package:timezone/data/latest.dart';
import 'package:immich_mobile/constants/locales.dart';
import 'package:immich_mobile/services/background.service.dart';
import 'package:immich_mobile/entities/backup_album.entity.dart';
import 'package:immich_mobile/entities/duplicated_asset.entity.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/routing/tab_navigation_observer.dart';
import 'package:immich_mobile/utils/cache/widgets_binding.dart';
import 'package:immich_mobile/entities/album.entity.dart';
import 'package:immich_mobile/entities/android_device_asset.entity.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/etag.entity.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/entities/ios_device_asset.entity.dart';
import 'package:immich_mobile/entities/logger_message.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/entities/user.entity.dart';
import 'package:immich_mobile/providers/app_life_cycle.provider.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/services/immich_logger.service.dart';
import 'package:immich_mobile/services/local_notification.service.dart';
import 'package:immich_mobile/utils/http_ssl_cert_override.dart';
import 'package:immich_mobile/utils/immich_app_theme.dart';
import 'package:immich_mobile/utils/migration.dart';
import 'package:isar/isar.dart';
import 'package:logging/logging.dart';
import 'package:path_provider/path_provider.dart';

void main() async {
  ImmichWidgetsBinding();
  final db = await loadDb();
  await initApp();
  await migrateDatabaseIfNeeded(db);
  HttpOverrides.global = HttpSSLCertOverride();

  runApp(
    ProviderScope(
      overrides: [dbProvider.overrideWithValue(db)],
      child: const MainWidget(),
    ),
  );
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

  await fetchSystemPalette();

  // Initialize Immich Logger Service
  ImmichLogger();

  var log = Logger("ImmichErrorLogger");

  FlutterError.onError = (details) {
    debugPrint("FlutterError - Catch all: $details");
    FlutterError.presentError(details);
    log.severe(
      'FlutterError - Catch all',
      "${details.toString()}\nException: ${details.exception}\nLibrary: ${details.library}\nContext: ${details.context}",
      details.stack,
    );
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    log.severe('PlatformDispatcher - Catch all', error, stack);
    return true;
  };

  initializeTimeZones();

  FileDownloader().configureNotification(
    running: const TaskNotification('Downloading media', 'file: {filename}'),
    complete: const TaskNotification('Download finished', 'file: {filename}'),
    progressBar: true,
  );
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
      if (Platform.isAndroid) AndroidDeviceAssetSchema,
      if (Platform.isIOS) IOSDeviceAssetSchema,
    ],
    directory: dir.path,
    maxSizeMiB: 1024,
  );
  Store.init(db);
  return db;
}

final overlayPortalControllerProvider =
    Provider<OverlayPortalController>((ref) {
  return OverlayPortalController();
});

class ImmichApp extends ConsumerStatefulWidget {
  const ImmichApp({super.key});

  @override
  ImmichAppState createState() => ImmichAppState();
}

class ImmichAppState extends ConsumerState<ImmichApp>
    with WidgetsBindingObserver {
  int progress = 0;

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.resumed:
        debugPrint("[APP STATE] resumed");
        ref.read(appStateProvider.notifier).handleAppResume();
        break;
      case AppLifecycleState.inactive:
        debugPrint("[APP STATE] inactive");
        ref.read(appStateProvider.notifier).handleAppInactivity();
        break;
      case AppLifecycleState.paused:
        debugPrint("[APP STATE] paused");
        ref.read(appStateProvider.notifier).handleAppPause();
        break;
      case AppLifecycleState.detached:
        debugPrint("[APP STATE] detached");
        ref.read(appStateProvider.notifier).handleAppDetached();
        break;
      case AppLifecycleState.hidden:
        debugPrint("[APP STATE] hidden");
        ref.read(appStateProvider.notifier).handleAppHidden();
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
        overlayStyle = context.isDarkTheme
            ? SystemUiOverlayStyle.dark
            : SystemUiOverlayStyle.light;
      }
    }
    SystemChrome.setSystemUIOverlayStyle(overlayStyle);
    await ref.read(localNotificationService).setup();
  }

  @override
  initState() {
    super.initState();
    initApp().then((_) => debugPrint("App Init Completed"));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // needs to be delayed so that EasyLocalization is working
      ref.read(backgroundServiceProvider).resumeServiceIfEnabled();
    });

    FileDownloader().updates.listen((update) {
      switch (update) {
        case TaskStatusUpdate():
          // process the TaskStatusUpdate, e.g.
          switch (update.status) {
            case TaskStatus.complete:
              print('Task ${update.task.taskId} success!');
              ref.read(overlayPortalControllerProvider).hide();

            case TaskStatus.canceled:
              print('Download was canceled');

            case TaskStatus.paused:
              print('Download was paused');

            case TaskStatus.enqueued:
              print('Download was enqueued');

            case TaskStatus.running:
              ref.read(overlayPortalControllerProvider).show();
              print('Download is running');

            default:
              print('Download not successful ${update.status}');
          }

        case TaskProgressUpdate():
          setState(() {
            progress = (update.progress * 100).round();
          });
      }
    });

    ref.read(overlayPortalControllerProvider).show();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    final immichTheme = ref.watch(immichThemeProvider);

    return MaterialApp(
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale,
      debugShowCheckedModeBanner: true,
      home: OverlayPortal(
        controller: ref.read(overlayPortalControllerProvider),
        overlayChildBuilder: (BuildContext context) {
          return DownloadInfoOverlay(progress: progress);
        },
        child: MaterialApp.router(
          title: 'Immich',
          debugShowCheckedModeBanner: false,
          themeMode: ref.watch(immichThemeModeProvider),
          darkTheme: getThemeData(colorScheme: immichTheme.dark),
          theme: getThemeData(colorScheme: immichTheme.light),
          routeInformationParser: router.defaultRouteParser(),
          routerDelegate: router.delegate(
            navigatorObservers: () => [TabNavigationObserver(ref: ref)],
          ),
        ),
      ),
    );
  }
}

class DownloadInfoOverlay extends HookConsumerWidget {
  final int progress;

  const DownloadInfoOverlay({
    super.key,
    required this.progress,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Positioned(
      left: 8,
      bottom: 120,
      child: Card(
        elevation: 5,
        color: context.colorScheme.surface,
        child: Padding(
          padding: const EdgeInsets.all(8.0),
          child: Text(
            'Progress: $progress',
            style: const TextStyle(fontSize: 12),
          ),
        ),
      ),
    );
  }
}

// ignore: prefer-single-widget-per-file
class MainWidget extends StatelessWidget {
  const MainWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return EasyLocalization(
      supportedLocales: locales.values.toList(),
      path: translationsPath,
      useFallbackTranslations: true,
      fallbackLocale: locales.values.first,
      child: const ImmichApp(),
    );
  }
}
