import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';

enum AppSettingsEnum {
  threeStageLoading, // true, false,
  themeMode, // "light","dark"
}

class AppSettingsService {
  late final Box hiveBox;

  AppSettingsService() {
    hiveBox = Hive.box(userSettingInfoBox);
  }

  T getSetting<T>(AppSettingsEnum settingType) {
    var settingKey = _settingHiveBoxKeyLookup(settingType);

    if (!hiveBox.containsKey(settingKey)) {
      T defaultSetting = _setDefaultSetting(settingType);
      return defaultSetting;
    }

    var result = hiveBox.get(settingKey);

    if (result is T) {
      return result;
    } else {
      debugPrint("Incorrect setting type");
      throw TypeError();
    }
  }

  setSetting<T>(AppSettingsEnum settingType, T value) {
    var settingKey = _settingHiveBoxKeyLookup(settingType);

    if (hiveBox.containsKey(settingKey)) {
      var result = hiveBox.get(settingKey);

      if (result is! T) {
        debugPrint("Incorrect setting type");
        throw TypeError();
      }

      hiveBox.put(settingKey, value);
    } else {
      hiveBox.put(settingKey, value);
    }
  }

  _setDefaultSetting(AppSettingsEnum settingType) {
    var settingKey = _settingHiveBoxKeyLookup(settingType);

    // Default value of threeStageLoading is false
    if (settingType == AppSettingsEnum.threeStageLoading) {
      hiveBox.put(settingKey, false);
      return false;
    }

    // Default value of themeMode is "light"
    if (settingType == AppSettingsEnum.themeMode) {
      hiveBox.put(settingKey, "light");
      return "light";
    }
  }

  String _settingHiveBoxKeyLookup(AppSettingsEnum settingType) {
    switch (settingType) {
      case AppSettingsEnum.threeStageLoading:
        return 'threeStageLoading';
      case AppSettingsEnum.themeMode:
        return 'themeMode';
    }
  }
}

final appSettingsServiceProvider = Provider((ref) => AppSettingsService());
