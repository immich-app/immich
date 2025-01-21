import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';

class MemoryViewerSetting extends HookConsumerWidget {
  const MemoryViewerSetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isKeyStored =
        Store.tryGet(AppSettingsEnum.memoryIncludesSharedAlbum.storeKey) ??
            false;
    if (!isKeyStored) {
      Store.put(
        AppSettingsEnum.memoryIncludesSharedAlbum.storeKey,
        AppSettingsEnum.memoryIncludesSharedAlbum.defaultValue,
      );
    }
    final memoryIncludesSharedAlbum =
        useAppSettingsState(AppSettingsEnum.memoryIncludesSharedAlbum);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingsSubTitle(title: "memories_settings_title".tr()),
        SettingsSwitchListTile(
          valueNotifier: memoryIncludesSharedAlbum,
          title: "memories_includes_shared_albums".tr(),
          subtitle: "memories_includes_shared_albums_content".tr(),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
