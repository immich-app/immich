import 'package:hive_flutter/hive_flutter.dart';
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
    if (!hiveBox.containsKey(settingType.hiveKey)) {
      return _setDefault(settingType);
    }

    var result = hiveBox.get(settingType.hiveKey);

    if (result is! T) {
      return _setDefault(settingType);
    }

    return result;
  }

  setSetting<T>(AppSettingsEnum<T> settingType, T value) {
    hiveBox.put(settingType.hiveKey, value);
  }

  T _setDefault<T>(AppSettingsEnum<T> settingType) {
    hiveBox.put(settingType.hiveKey, settingType.defaultValue);
    return settingType.defaultValue;
  }
}
