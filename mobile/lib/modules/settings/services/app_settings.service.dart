import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';

enum AppSettingsEnum<T> {
  threeStageLoading<bool>("threeStageLoading", false),
  themeMode<String>("themeMode", "system"), // "light","dark","system"
  tilesPerRow<int>("tilesPerRow", 4),
  storageIndicator<bool>("storageIndicator", true);

  const AppSettingsEnum(this.hiveKey, this.defaultValue);

  final String hiveKey;
  final T defaultValue;
}

class AppSettingsService {
  late final Box hiveBox;

  AppSettingsService() {
    hiveBox = Hive.box(userSettingInfoBox);
  }

  T getSetting<T>(AppSettingsEnum<T> settingType) {
    var settingKey = settingType.hiveKey;

    if (!hiveBox.containsKey(settingKey)) {
      hiveBox.put(settingType.hiveKey, settingType.defaultValue);
      return settingType.defaultValue;
    }

    var result = hiveBox.get(settingKey);

    if (result is! T) {
      hiveBox.put(settingType.hiveKey, settingType.defaultValue);
      return settingType.defaultValue;
    }

    return result;
  }

  setSetting<T>(AppSettingsEnum<T> settingType, T value) {
    hiveBox.put(settingType.hiveKey, value);
  }
}
