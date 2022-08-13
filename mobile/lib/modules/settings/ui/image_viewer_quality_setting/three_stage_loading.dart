import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/services/user_setting.service.dart';

class ThreeStageLoading extends HookConsumerWidget {
  const ThreeStageLoading({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userSetting = ref.watch(userSettingServiceProvider);

    final isEnable = useState(false);

    useEffect(
      () {
        var isThreeStageLoadingEnable =
            userSetting.getSetting(UserSettingEnum.threeStageLoading);

        print("isThreeStageLoadingEnable $isThreeStageLoadingEnable");
        isEnable.value = isThreeStageLoadingEnable;
        return null;
      },
      [],
    );

    void onSwitchChanged(bool switchValue) {
      isEnable.value = switchValue;
    }

    return SwitchListTile.adaptive(
      title: const Text(
        "Enable three stage loading",
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
        ),
      ),
      subtitle: const Text(
        "The three-stage loading will deliver the best quality image",
        style: TextStyle(
          fontSize: 12,
        ),
      ),
      value: isEnable.value,
      onChanged: onSwitchChanged,
    );
  }
}
