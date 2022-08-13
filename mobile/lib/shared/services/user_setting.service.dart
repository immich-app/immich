import 'package:flutter/material.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/hive_box.dart';

enum UserSettingEnum {
  threeStageLoading,
}

class UserSettingService {
  late Box hiveBox;

  UserSettingService() {
    hiveBox = Hive.box(userSettingInfoBox);
  }

  T getSetting<T>(UserSettingEnum settingType) {
    var settingKey = _settingHiveBoxKeyLookup(settingType);

    if (hiveBox.containsKey(settingKey)) {
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

  _setDefaultSetting(UserSettingEnum settingType) {
    var settingKey = _settingHiveBoxKeyLookup(settingType);

    // Default value of threeStageLoading is false
    if (settingType == UserSettingEnum.threeStageLoading) {
      hiveBox.put(settingKey, false);
      return false;
    }
  }

  String _settingHiveBoxKeyLookup(UserSettingEnum settingType) {
    switch (settingType) {
      case UserSettingEnum.threeStageLoading:
        {
          return 'threeStageLoading';
        }
    }
  }
}

final userSettingServiceProvider = Provider((ref) => UserSettingService());
