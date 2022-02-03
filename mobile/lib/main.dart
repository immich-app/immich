import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/shared/providers/app_state.provider.dart';
import 'constants/hive_box.dart';
import 'package:google_fonts/google_fonts.dart';

void main() async {
  await Hive.initFlutter();
  await Hive.openBox(userInfoBox);
  // Hive.registerAdapter(ImmichBackUpAssetAdapter());
  // Hive.deleteBoxFromDisk(hiveImmichBox);

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
        ref.read(appStateProvider.notifier).state = AppStateEnum.resumed;
        break;
      case AppLifecycleState.inactive:
        debugPrint("[APP STATE] inactive");
        ref.read(appStateProvider.notifier).state = AppStateEnum.inactive;
        break;
      case AppLifecycleState.paused:
        debugPrint("[APP STATE] paused");
        ref.read(appStateProvider.notifier).state = AppStateEnum.paused;
        break;
      case AppLifecycleState.detached:
        debugPrint("[APP STATE] detached");
        ref.read(appStateProvider.notifier).state = AppStateEnum.detached;
        break;
    }
  }

  Future<void> initApp() async {
    // ! TOBE DELETE
    // Simulate Sign In And Register/Get Device ID
    // await ref.read(authenticationProvider.notifier).login();
    // ref.read(backupProvider.notifier).getBackupInfo();
    // WidgetsBinding.instance?.addObserver(this);
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
        ),
      ),
      routeInformationParser: _immichRouter.defaultRouteParser(),
      routerDelegate: _immichRouter.delegate(),
    );
  }
}
