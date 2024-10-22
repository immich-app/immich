import 'package:flutter/material.dart';
import 'package:immich_mobile/presentation/theme/app_colors.dart';
import 'package:immich_mobile/presentation/theme/app_typography.dart';
import 'package:immich_mobile/utils/extensions/material_state.extension.dart';
import 'package:material_symbols_icons/symbols.dart';

enum AppTheme {
  blue._(AppColors.blueLight, AppColors.blueDark),
  // Fallback color for dynamic theme for non-supported platforms
  dynamic._(AppColors.blueLight, AppColors.blueDark);

  final ColorScheme lightSchema;
  final ColorScheme darkSchema;

  const AppTheme._(this.lightSchema, this.darkSchema);

  static ThemeData generateThemeData(ColorScheme color) {
    return ThemeData(
      inputDecorationTheme: InputDecorationTheme(
        hintStyle: const TextStyle(
          fontSize: 16.0,
          fontWeight: FontWeight.normal,
        ),
        errorBorder: OutlineInputBorder(
          borderSide: BorderSide(color: color.error),
          borderRadius: const BorderRadius.all(Radius.circular(15)),
        ),
        focusedBorder: OutlineInputBorder(
          borderSide: BorderSide(color: color.primary),
          borderRadius: const BorderRadius.all(Radius.circular(15)),
        ),
        focusedErrorBorder: OutlineInputBorder(
          borderSide: BorderSide(color: color.error),
          borderRadius: const BorderRadius.all(Radius.circular(15)),
        ),
        enabledBorder: OutlineInputBorder(
          borderSide: BorderSide(color: color.outlineVariant),
          borderRadius: const BorderRadius.all(Radius.circular(15)),
        ),
      ),
      colorScheme: color,
      primaryColor: color.primary,
      scaffoldBackgroundColor: color.surface,
      iconTheme: const IconThemeData(size: 24, weight: 500, opticalSize: 24),
      textTheme: TextTheme(
        displayLarge: AppTypography.displayLarge,
        displayMedium: AppTypography.displayMedium,
        displaySmall: AppTypography.displaySmall,
        headlineLarge: AppTypography.headlineLarge,
        headlineMedium: AppTypography.headlineMedium,
        headlineSmall: AppTypography.headlineSmall,
        titleLarge: AppTypography.titleLarge,
        titleMedium: AppTypography.titleMedium,
        titleSmall: AppTypography.titleSmall,
        bodyLarge: AppTypography.bodyLarge,
        bodyMedium: AppTypography.bodyMedium,
        bodySmall: AppTypography.bodySmall,
        labelLarge: AppTypography.labelLarge,
        labelMedium: AppTypography.labelMedium,
        labelSmall: AppTypography.labelSmall,
      ),
      actionIconTheme: ActionIconThemeData(
        backButtonIconBuilder: (_) => Icon(Symbols.arrow_back_rounded),
        closeButtonIconBuilder: (_) => Icon(Symbols.close_rounded),
      ),
      appBarTheme: AppBarTheme(
        iconTheme: IconThemeData(size: 22, color: color.onSurface),
        titleTextStyle:
            AppTypography.titleLarge.copyWith(color: color.onSurface),
      ),
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
      navigationRailTheme: NavigationRailThemeData(
        backgroundColor: color.surfaceContainer,
        elevation: 3,
        unselectedIconTheme: IconThemeData(
          weight: 500,
          opticalSize: 24,
          color: color.onSurface.withAlpha(175),
        ),
        selectedIconTheme:
            IconThemeData(weight: 500, opticalSize: 24, color: color.onPrimary),
        indicatorColor: color.primary,
      ),
      sliderTheme: SliderThemeData(
        valueIndicatorColor:
            Color.alphaBlend(color.primary.withAlpha(80), color.onSurface)
                .withAlpha(240),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor:
            Color.alphaBlend(color.primary.withAlpha(80), color.onSurface)
                .withAlpha(240),
        actionTextColor: color.inversePrimary,
        contentTextStyle: TextStyle(color: color.onInverseSurface),
        elevation: 4,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(4.0)),
        ),
        behavior: SnackBarBehavior.floating,
        insetPadding: const EdgeInsets.fromLTRB(20.0, 5.0, 20.0, 25.0),
        closeIconColor: color.onInverseSurface,
      ),
      textSelectionTheme: TextSelectionThemeData(cursorColor: color.primary),
    );
  }
}
