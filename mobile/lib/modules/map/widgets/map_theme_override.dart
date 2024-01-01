import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/providers/map_state.provider.dart';
import 'package:immich_mobile/utils/immich_app_theme.dart';

class MapThemeOveride extends StatefulHookConsumerWidget {
  final ThemeMode? themeMode;
  final Widget Function(AsyncValue<String> style) mapBuilder;

  const MapThemeOveride({required this.mapBuilder, this.themeMode, super.key});

  @override
  ConsumerState createState() => _MapThemeOverideState();
}

class _MapThemeOverideState extends ConsumerState<MapThemeOveride>
    with WidgetsBindingObserver {
  late ThemeMode theme;
  bool isDarkTheme = false;

  bool checkDarkTheme() {
    return theme == ThemeMode.dark ||
        theme == ThemeMode.system &&
            PlatformDispatcher.instance.platformBrightness == Brightness.dark;
  }

  @override
  void initState() {
    super.initState();
    theme = widget.themeMode ??
        ref.read(mapStateNotifierProvider.select((v) => v.themeMode));
    setState(() {
      isDarkTheme = checkDarkTheme();
    });
    if (theme == ThemeMode.system) {
      WidgetsBinding.instance.addObserver(this);
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (theme != ThemeMode.system) {
      WidgetsBinding.instance.removeObserver(this);
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangePlatformBrightness() {
    super.didChangePlatformBrightness();

    if (theme == ThemeMode.system) {
      setState(
        () => isDarkTheme =
            PlatformDispatcher.instance.platformBrightness == Brightness.dark,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    theme = widget.themeMode ??
        ref.watch(mapStateNotifierProvider.select((v) => v.themeMode));

    useValueChanged<ThemeMode, void>(theme, (_, __) {
      if (theme == ThemeMode.system) {
        WidgetsBinding.instance.addObserver(this);
      } else {
        WidgetsBinding.instance.removeObserver(this);
      }
      setState(() {
        isDarkTheme = checkDarkTheme();
      });
    });

    return Theme(
      data: isDarkTheme ? immichDarkTheme : immichLightTheme,
      child: widget.mapBuilder.call(
        ref.watch(
          mapStateNotifierProvider.select(
            (v) => isDarkTheme ? v.darkStyleFetched : v.lightStyleFetched,
          ),
        ),
      ),
    );
  }
}
