import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/theme/app_colors.dart';
import 'package:immich_mobile/utils/extensions/material_state.extension.dart';

enum AppTheme {
  blue._(AppColors.blueLight, AppColors.blueDark),
  // Fallback color for dynamic theme for non-supported platforms
  dynamic._(AppColors.blueLight, AppColors.blueDark);

  final ColorScheme lightSchema;
  final ColorScheme darkSchema;

  const AppTheme._(this.lightSchema, this.darkSchema);

  static ThemeData generateThemeData(ColorScheme color) {
    return ThemeData(
      colorScheme: color,
      primaryColor: color.primary,
      iconTheme: const IconThemeData(weight: 500, opticalSize: 24),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: color.surfaceContainer,
        indicatorColor: color.primary,
        iconTheme: WidgetStateProperty.resolveWith(
          (Set<WidgetState> states) {
            if (states.isSelected) {
              return IconThemeData(color: color.onPrimary);
            }
            return IconThemeData(color: color.onSurface.withAlpha(175));
          },
        ),
      ),
      scaffoldBackgroundColor: color.surface,
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: color.surfaceContainer,
        elevation: 3,
        indicatorColor: color.primary,
        selectedIconTheme:
            IconThemeData(weight: 500, opticalSize: 24, color: color.onPrimary),
        unselectedIconTheme: IconThemeData(
          weight: 500,
          opticalSize: 24,
          color: color.onSurface.withAlpha(175),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: color.primary),
          borderRadius: const BorderRadius.all(Radius.circular(15)),
        ),
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(color: color.outlineVariant),
          borderRadius: const BorderRadius.all(Radius.circular(15)),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: const BorderRadius.all(Radius.circular(15)),
          borderSide: BorderSide(color: color.error),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderRadius: const BorderRadius.all(Radius.circular(15)),
          borderSide: BorderSide(color: color.error),
        ),
        hintStyle: const TextStyle(
          fontSize: 16.0,
          fontWeight: FontWeight.normal,
        ),
      ),
      textSelectionTheme: TextSelectionThemeData(cursorColor: color.primary),
      sliderTheme: SliderThemeData(
        valueIndicatorColor:
            Color.alphaBlend(color.primary.withAlpha(80), color.onSurface)
                .withAlpha(240),
      ),
      snackBarTheme: SnackBarThemeData(
        elevation: 4,
        behavior: SnackBarBehavior.floating,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(4.0)),
        ),
        insetPadding: const EdgeInsets.fromLTRB(20.0, 5.0, 20.0, 25.0),
        backgroundColor:
            Color.alphaBlend(color.primary.withAlpha(80), color.onSurface)
                .withAlpha(240),
        actionTextColor: color.inversePrimary,
        contentTextStyle: TextStyle(color: color.onInverseSurface),
        closeIconColor: color.onInverseSurface,
      ),
    );
  }
}
