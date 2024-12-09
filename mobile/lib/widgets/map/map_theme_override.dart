import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/locale_provider.dart';
import 'package:immich_mobile/providers/map/map_state.provider.dart';
import 'package:immich_mobile/providers/theme.provider.dart';
import 'package:immich_mobile/theme/theme_data.dart';

/// Overrides the theme below the widget tree to use the theme data based on the
/// map settings instead of the one from the app settings
class MapThemeOverride extends StatefulHookConsumerWidget {
  final ThemeMode? themeMode;
  final Widget Function(AsyncValue<String> style) mapBuilder;

  const MapThemeOverride({required this.mapBuilder, this.themeMode, super.key});

  @override
  ConsumerState createState() => _MapThemeOverrideState();
}

class _MapThemeOverrideState extends ConsumerState<MapThemeOverride>
    with WidgetsBindingObserver {
  late ThemeMode _theme;
  bool _isDarkTheme = false;

  bool get _isSystemDark =>
      WidgetsBinding.instance.platformDispatcher.platformBrightness ==
      Brightness.dark;

  bool checkDarkTheme() {
    return _theme == ThemeMode.dark ||
        _theme == ThemeMode.system && _isSystemDark;
  }

  @override
  void initState() {
    super.initState();
    _theme = widget.themeMode ??
        ref.read(mapStateNotifierProvider.select((v) => v.themeMode));
    setState(() {
      _isDarkTheme = checkDarkTheme();
    });
    if (_theme == ThemeMode.system) {
      WidgetsBinding.instance.addObserver(this);
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_theme != ThemeMode.system) {
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

    if (_theme == ThemeMode.system) {
      setState(() => _isDarkTheme = _isSystemDark);
    }
  }

  @override
  Widget build(BuildContext context) {
    _theme = widget.themeMode ??
        ref.watch(mapStateNotifierProvider.select((v) => v.themeMode));
    var appTheme = ref.watch(immichThemeProvider);
    final locale = ref.watch(localeProvider);

    useValueChanged<ThemeMode, void>(_theme, (_, __) {
      if (_theme == ThemeMode.system) {
        WidgetsBinding.instance.addObserver(this);
      } else {
        WidgetsBinding.instance.removeObserver(this);
      }
      setState(() {
        _isDarkTheme = checkDarkTheme();
      });
    });

    return Theme(
      data: _isDarkTheme
          ? getThemeData(colorScheme: appTheme.dark, locale: locale)
          : getThemeData(colorScheme: appTheme.light, locale: locale),
      child: widget.mapBuilder.call(
        ref.watch(
          mapStateNotifierProvider.select(
            (v) => _isDarkTheme ? v.darkStyleFetched : v.lightStyleFetched,
          ),
        ),
      ),
    );
  }
}
