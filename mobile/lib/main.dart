import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_displaymode/flutter_displaymode.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/immich_colors.dart';
import 'package:immich_mobile/modules/backup/models/hive_backup_albums.model.dart';
import 'package:immich_mobile/modules/backup/providers/backup.provider.dart';
import 'package:immich_mobile/modules/login/models/hive_saved_login_info.model.dart';
import 'package:immich_mobile/modules/login/providers/authentication.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/routing/tab_navigation_observer.dart';
import 'package:immich_mobile/shared/providers/app_state.provider.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/providers/release_info.provider.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:immich_mobile/shared/providers/websocket.provider.dart';
import 'package:immich_mobile/shared/views/immich_loading_overlay.dart';
import 'package:immich_mobile/shared/views/version_announcement_overlay.dart';
import 'constants/hive_box.dart';

void main() async {
  await Hive.initFlutter();

  Hive.registerAdapter(HiveSavedLoginInfoAdapter());
  Hive.registerAdapter(HiveBackupAlbumsAdapter());

  await Hive.openBox(userInfoBox);
  await Hive.openBox<HiveSavedLoginInfo>(hiveLoginInfoBox);
  await Hive.openBox<HiveBackupAlbums>(hiveBackupInfoBox);
  await Hive.openBox(hiveGithubReleaseInfoBox);
  await Hive.openBox(userSettingInfoBox);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarIconBrightness: Brightness.light,
    ),
  );

  await EasyLocalization.ensureInitialized();

  var locales = const [
    // Default locale
    Locale('en', 'US'),
    // Additional locales
    Locale('da', 'DK'),
    Locale('de', 'DE'),
    Locale('es', 'ES'),
    Locale('fr', 'FR'),
    Locale('it', 'IT'),
  ];

  if (kReleaseMode && Platform.isAndroid) {
    try {
      await FlutterDisplayMode.setHighRefreshRate();
    } catch (e) {
      debugPrint("Error setting high refresh rate: $e");
    }
  }

  runApp(
    EasyLocalization(
      supportedLocales: locales,
      path: 'assets/i18n',
      useFallbackTranslations: true,
      fallbackLocale: locales.first,
      child: const ProviderScope(child: ImmichApp()),
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
          ref.watch(backupProvider.notifier).resumeBackup();
          ref.watch(assetProvider.notifier).getAllAsset();
          ref.watch(serverInfoProvider.notifier).getServerVersion();
        }

        ref.watch(websocketProvider.notifier).connect();

        ref.watch(releaseInfoProvider.notifier).checkGithubReleaseInfo();

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
            themeMode: ThemeMode.light,
            darkTheme: ThemeData(
              useMaterial3: true,
              brightness: Brightness.dark,
              primarySwatch: Colors.indigo,
              fontFamily: 'WorkSans',
              snackBarTheme: const SnackBarThemeData(
                contentTextStyle: TextStyle(fontFamily: 'WorkSans'),
              ),
              scaffoldBackgroundColor: immichDarkBackgroundColor,
              appBarTheme: AppBarTheme(
                titleTextStyle: const TextStyle(
                  color: Color.fromARGB(255, 178, 190, 245),
                ),
                backgroundColor: Colors.grey[900],
                foregroundColor: Colors.grey[300],
                elevation: 1,
                centerTitle: true,
                systemOverlayStyle: SystemUiOverlayStyle.light,
              ),
              bottomNavigationBarTheme: const BottomNavigationBarThemeData(
                type: BottomNavigationBarType.fixed,
                backgroundColor: immichDarkBackgroundColor,
                selectedItemColor: Color.fromARGB(255, 132, 144, 207),
              ),
              textTheme: TextTheme(
                headline1: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[300],
                ),
                headline2: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey[300],
                ),
              ),
            ),
            theme: ThemeData(
              useMaterial3: true,
              brightness: Brightness.light,
              primarySwatch: Colors.indigo,
              fontFamily: 'WorkSans',
              snackBarTheme: const SnackBarThemeData(
                contentTextStyle: TextStyle(fontFamily: 'WorkSans'),
              ),
              scaffoldBackgroundColor: immichBackgroundColor,
              appBarTheme: const AppBarTheme(
                titleTextStyle: TextStyle(
                  color: Colors.indigo,
                ),
                backgroundColor: immichBackgroundColor,
                foregroundColor: Colors.indigo,
                elevation: 1,
                centerTitle: true,
                systemOverlayStyle: SystemUiOverlayStyle.light,
              ),
              bottomNavigationBarTheme: const BottomNavigationBarThemeData(
                type: BottomNavigationBarType.fixed,
                backgroundColor: immichBackgroundColor,
                selectedItemColor: Colors.indigo,
              ),
              textTheme: TextTheme(
                headline1: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.bold,
                  color: Theme.of(context).primaryColor,
                ),
                headline2: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
            ),
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
