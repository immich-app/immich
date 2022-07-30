import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import '../../constants/hive_box.dart';

class ThemeInfoNotifier extends StateNotifier<bool> {
  ThemeInfoNotifier() : super(false);
  bool isDark = Hive.box(themeInfoBox).get(themeInfoKey);
  setTheme(bool value) {
    Hive.box(themeInfoBox).put(themeInfoKey, value);
  }

  bool getTheme() {
    return Hive.box(themeInfoBox).get(themeInfoKey);
  }
}

final themeModeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.system);
final isDarkModeProvider = Provider<bool>((ref) {
  final themeMode = ref.watch(themeModeProvider);
  return themeMode == ThemeMode.dark;
});
