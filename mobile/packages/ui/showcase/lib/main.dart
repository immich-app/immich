import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:immich_ui/immich_ui.dart';
import 'package:showcase/app_theme.dart';
import 'package:showcase/constants.dart';
import 'package:showcase/router.dart';
import 'package:showcase/widgets/example_card.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeCodeHighlighter();
  runApp(const ShowcaseApp());
}

class ShowcaseApp extends StatefulWidget {
  const ShowcaseApp({super.key});

  @override
  State<ShowcaseApp> createState() => _ShowcaseAppState();
}

class _ShowcaseAppState extends State<ShowcaseApp> {
  ThemeMode _themeMode = ThemeMode.light;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _router = AppRouter.createRouter(_toggleTheme);
  }

  void _toggleTheme() {
    setState(() {
      _themeMode = _themeMode == ThemeMode.light
          ? ThemeMode.dark
          : ThemeMode.light;
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: appTitle,
      themeMode: _themeMode,
      routerConfig: _router,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      debugShowCheckedModeBanner: false,
      builder: (context, child) => ImmichThemeProvider(
        colorScheme: Theme.of(context).colorScheme,
        child: child!,
      ),
    );
  }
}
