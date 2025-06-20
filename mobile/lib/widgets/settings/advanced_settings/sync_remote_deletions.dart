import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/repositories/local_files_manager.repository.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';

class SyncRemoteDeletionsSetting extends HookConsumerWidget {
  const SyncRemoteDeletionsSetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final manageLocalMediaAndroid =
        useAppSettingsState(AppSettingsEnum.manageLocalMediaAndroid);
    return SettingsCardLayout(
      header: const SettingSectionHeader(
        title: "Placeholder",
      ),
      children: [
        SettingSwitchListTile(
          valueNotifier: manageLocalMediaAndroid,
          title: 'advanced_settings_sync_remote_deletions_title'
              .t(context: context),
          subtitle: 'advanced_settings_sync_remote_deletions_subtitle'
              .t(context: context),
          onChanged: (value) async {
            if (value) {
              final result = await ref
                  .read(localFilesManagerRepositoryProvider)
                  .requestManageMediaPermission();
              manageLocalMediaAndroid.value = result;
            }
          },
        ),
      ],
    );
  }
}
