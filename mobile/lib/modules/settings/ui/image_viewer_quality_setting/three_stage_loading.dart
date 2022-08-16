import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

class ThreeStageLoading extends HookConsumerWidget {
  const ThreeStageLoading({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appSettingService = ref.watch(appSettingsServiceProvider);

    final isEnable = useState(false);

    useEffect(
      () {
        var isThreeStageLoadingEnable =
            appSettingService.getSetting(AppSettingsEnum.threeStageLoading);

        isEnable.value = isThreeStageLoadingEnable;
        return null;
      },
      [],
    );

    void onSwitchChanged(bool switchValue) {
      appSettingService.setSetting(
        AppSettingsEnum.threeStageLoading,
        switchValue,
      );
      isEnable.value = switchValue;
    }

    return SwitchListTile.adaptive(
      title: const Text(
        "theme_setting_three_stage_loading_title",
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ).tr(),
      subtitle: const Text(
        "theme_setting_three_stage_loading_subtitle",
        style: TextStyle(
          fontSize: 12,
        ),
      ).tr(),
      value: isEnable.value,
      onChanged: onSwitchChanged,
    );
  }
}
