import 'package:flutter/material.dart';
import 'package:immich_mobile/widgets/settings/preference_settings/app_icon_setting.dart';
import 'package:immich_mobile/widgets/settings/preference_settings/haptic_setting.dart';
import 'package:immich_mobile/widgets/settings/preference_settings/share_setting.dart';
import 'package:immich_mobile/widgets/settings/preference_settings/theme_setting.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';

class PreferenceSetting extends StatelessWidget {
  const PreferenceSetting({super.key});

  @override
  Widget build(BuildContext context) {
    const preferenceSettings = [ThemeSetting(), AppIconSetting(), HapticSetting(), ShareSetting()];

    return const SettingsSubPageScaffold(settings: preferenceSettings, showDivider: true);
  }
}
