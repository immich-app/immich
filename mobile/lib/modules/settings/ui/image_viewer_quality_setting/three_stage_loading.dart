import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/services/app_settings.service.dart';

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
        "Enable three stage loading",
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
      subtitle: const Text(
        "The three-stage loading delivers the best quality image in exchange for a slower loading speed",
        style: TextStyle(
          fontSize: 12,
        ),
      ),
      value: isEnable.value,
      onChanged: onSwitchChanged,
    );
  }
}
