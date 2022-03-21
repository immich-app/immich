import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/home/providers/asset.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/routing/tab_navigation_observer.dart';
import 'package:immich_mobile/shared/providers/app_state.provider.dart';
import 'package:immich_mobile/shared/providers/backup.provider.dart';
import 'package:immich_mobile/shared/providers/server_info.provider.dart';
import 'package:immich_mobile/shared/providers/websocket.provider.dart';
import 'constants/hive_box.dart';
import 'package:google_fonts/google_fonts.dart';

void main() async {
  await Hive.initFlutter();
  await Hive.openBox(userInfoBox);
  // Hive.registerAdapter(ImmichBackUpAssetAdapter());
  // Hive.deleteBoxFromDisk(hiveImmichBox);

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarIconBrightness: Brightness.light,
    ),
  );

  runApp(const ProviderScope(child: ImmichApp()));
}

class ImmichApp extends ConsumerStatefulWidget {
  const ImmichApp({Key? key}) : super(key: key);

  @override
  _ImmichAppState createState() => _ImmichAppState();
}

class _ImmichAppState extends ConsumerState<ImmichApp> with WidgetsBindingObserver {
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.resumed:
        debugPrint("[APP STATE] resumed");
        ref.watch(appStateProvider.notifier).state = AppStateEnum.resumed;
        ref.watch(backupProvider.notifier).resumeBackup();
        ref.watch(websocketProvider.notifier).connect();
        ref.watch(assetProvider.notifier).getAllAsset();
        ref.watch(serverInfoProvider.notifier).getServerVersion();

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
    WidgetsBinding.instance?.addObserver(this);
  }

  @override
  initState() {
    super.initState();
    initApp().then((_) => debugPrint("App Init Completed"));
  }

  @override
  void dispose() {
    WidgetsBinding.instance?.removeObserver(this);
    super.dispose();
  }

  final _immichRouter = AppRouter();

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Immich',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        primarySwatch: Colors.indigo,
        textTheme: GoogleFonts.workSansTextTheme(
          Theme.of(context).textTheme.apply(fontSizeFactor: 1.0),
        ),
        scaffoldBackgroundColor: const Color(0xFFf6f8fe),
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.white,
          foregroundColor: Colors.indigo,
          elevation: 1,
          centerTitle: true,
          systemOverlayStyle: SystemUiOverlayStyle.dark,
        ),
      ),
      routeInformationParser: _immichRouter.defaultRouteParser(),
      routerDelegate: _immichRouter.delegate(navigatorObservers: () => [TabNavigationObserver(ref: ref)]),
    );
  }
}
