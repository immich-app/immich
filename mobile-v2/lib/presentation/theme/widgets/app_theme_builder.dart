import 'package:dynamic_color/dynamic_color.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/theme/utils/colors.dart';

class AppThemeBuilder extends StatelessWidget {
  const AppThemeBuilder({
    super.key,
    required this.theme,
    required this.builder,
  });

  /// Current app theme to switch the theme data used
  final AppTheme theme;

  /// Builds the child widget of this widget, providing a light and dark [ThemeData] based on the
  /// [theme] passed.
  final Widget Function(ThemeData lightTheme, ThemeData darkTheme) builder;

  @override
  Widget build(BuildContext context) {
    // Static colors
    if (theme != AppTheme.dynamic) {
      final lightTheme = AppColors.getThemeForColorScheme(theme.lightSchema);
      final darkTheme = AppColors.getThemeForColorScheme(theme.darkSchema);

      return builder(lightTheme, darkTheme);
    }

    // Dynamic color builder
    return DynamicColorBuilder(builder: (lightDynamic, darkDynamic) {
      final lightTheme =
          AppColors.getThemeForColorScheme(lightDynamic ?? theme.lightSchema);
      final darkTheme =
          AppColors.getThemeForColorScheme(darkDynamic ?? theme.darkSchema);

      return builder(lightTheme, darkTheme);
    });
  }
}
