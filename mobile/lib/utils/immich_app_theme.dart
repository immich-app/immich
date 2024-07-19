import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/immich_colors.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

class ImmichThemeData {
  ThemeData lightThemeData;
  ThemeData darkThemeData;

  ImmichThemeData(this.lightThemeData, this.darkThemeData);
}

final immichThemeModeProvider = StateProvider<ThemeMode>((ref) {
  var themeMode = ref
      .watch(appSettingsServiceProvider)
      .getSetting(AppSettingsEnum.themeMode);

  debugPrint("Current themeMode $themeMode");

  if (themeMode == "light") {
    return ThemeMode.light;
  } else if (themeMode == "dark") {
    return ThemeMode.dark;
  } else {
    return ThemeMode.system;
  }
});

final immichPrimaryColorProvider = StateProvider<ImmichColorMode>((ref) {
  var primaryColorName = ref
      .watch(appSettingsServiceProvider)
      .getSetting(AppSettingsEnum.primaryColor);

  debugPrint("Current colorMode $primaryColorName");

  return ImmichColorMode.values.firstWhere(
    (e) => e.name == primaryColorName,
  );
});

final immichThemeDataProvider = StateProvider<ImmichThemeData>((ref) {
  var primaryLight = ref.read(immichPrimaryColorProvider).getColor(false);
  var primaryDark = ref.read(immichPrimaryColorProvider).getColor(true);

  return ImmichThemeData(
    _getThemeData(false, primaryLight),
    _getThemeData(true, primaryDark),
  );
});

ThemeData _getThemeData(bool isDark, Color primaryColor) {
  return ThemeData(
    useMaterial3: true,
    brightness: isDark ? Brightness.dark : Brightness.light,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primaryColor,
      brightness: isDark ? Brightness.dark : Brightness.light,
    ),
    primaryColor: primaryColor,
    hintColor: primaryColor.withOpacity(.5),
    focusColor: primaryColor,
    splashColor: primaryColor.withOpacity(0.15),
    cardColor: isDark ? Colors.grey[900] : Colors.white,
    fontFamily: 'Overpass',
    snackBarTheme: SnackBarThemeData(
      contentTextStyle: TextStyle(
        fontFamily: 'Overpass',
        color: primaryColor,
        fontWeight: FontWeight.bold,
      ),
      backgroundColor: isDark ? Colors.grey[900] : Colors.white,
    ),
    appBarTheme: AppBarTheme(
      titleTextStyle: TextStyle(
        color: primaryColor,
        fontFamily: 'Overpass',
        fontWeight: FontWeight.bold,
        fontSize: 18,
      ),
      foregroundColor: primaryColor,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      shape: Border(
        bottom: BorderSide(
          color: isDark
              ? const Color(0xffffffff).withOpacity(.05)
              : const Color(0xFF202020).withOpacity(.1),
          width: 2,
        ),
      ),
    ),
    textTheme: TextTheme(
      displayLarge: TextStyle(
        fontSize: 26,
        fontWeight: FontWeight.bold,
        color: isDark ? Colors.white : primaryColor,
      ),
      displayMedium: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.bold,
        color: isDark ? Colors.white : Colors.black87,
      ),
      displaySmall: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.bold,
        color: primaryColor,
      ),
      titleSmall: const TextStyle(
        fontSize: 16.0,
        fontWeight: FontWeight.bold,
      ),
      titleMedium: const TextStyle(
        fontSize: 18.0,
        fontWeight: FontWeight.bold,
      ),
      titleLarge: const TextStyle(
        fontSize: 26.0,
        fontWeight: FontWeight.bold,
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryColor,
        foregroundColor: isDark ? Colors.black87 : Colors.white,
      ),
    ),
    chipTheme: const ChipThemeData(
      side: BorderSide.none,
    ),
    sliderTheme: const SliderThemeData(
      thumbShape: RoundSliderThumbShape(enabledThumbRadius: 7),
      trackHeight: 2.0,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      type: BottomNavigationBarType.fixed,
    ),
    popupMenuTheme: const PopupMenuThemeData(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.all(Radius.circular(10)),
      ),
    ),
    navigationBarTheme: const NavigationBarThemeData(
      labelTextStyle: WidgetStatePropertyAll(
        TextStyle(
          fontSize: 13,
          fontWeight: FontWeight.w500,
        ),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      focusedBorder: OutlineInputBorder(
        borderSide: BorderSide(
          color: primaryColor,
        ),
      ),
      labelStyle: TextStyle(
        color: primaryColor,
      ),
      hintStyle: const TextStyle(
        fontSize: 14.0,
        fontWeight: FontWeight.normal,
      ),
    ),
    textSelectionTheme: TextSelectionThemeData(
      cursorColor: primaryColor,
    ),
  );
}

Color getTonalButtonColor(BuildContext context) {
  return context.colorScheme.secondaryContainer.withOpacity(
    context.isDarkTheme ? 0.5 : 1,
  );
}
