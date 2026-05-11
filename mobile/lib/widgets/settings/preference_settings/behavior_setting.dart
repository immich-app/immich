import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

class BehaviorSetting extends HookConsumerWidget {
  const BehaviorSetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final swipeToDeleteSetting = useAppSettingsState(AppSettingsEnum.enableSwipeToDeleteAlbum);
    final isSwipeToDeleteEnabled = useValueNotifier(swipeToDeleteSetting.value);

    onSwipeToDeleteChange(bool isEnabled) {
      swipeToDeleteSetting.value = isEnabled;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: "behaviors_title".t(context: context),
          icon: Icons.settings_outlined,
        ),
        SettingsSwitchListTile(
          valueNotifier: isSwipeToDeleteEnabled,
          title: 'enable_swipe_to_delete_album'.t(context: context),
          onChanged: onSwipeToDeleteChange,
        ),
      ],
    );
  }
}
