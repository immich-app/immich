import 'dart:io';

import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/services/dynamic_wallpaper.service.dart';
import 'package:immich_mobile/widgets/settings/settings_button_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_radio_list_tile.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';

class DynamicWallpaperSettings extends ConsumerWidget {
  const DynamicWallpaperSettings({super.key});

  static const _intervalOptions = [
    SettingsRadioGroup(title: '15 min', value: 15),
    SettingsRadioGroup(title: '30 min', value: 30),
    SettingsRadioGroup(title: '1 h', value: 60),
    SettingsRadioGroup(title: '6 h', value: 360),
    SettingsRadioGroup(title: '24 h', value: 1440),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final config = ref.watch(appConfigProvider).dynamicWallpaper;
    final service = ref.watch(dynamicWallpaperServiceProvider);
    final selectedCount = config.assetIds.length;

    if (!Platform.isAndroid) {
      return SettingsSubPageScaffold(
        settings: [
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 20),
            title: Text('dynamic_wallpaper_settings_title'.tr()),
            subtitle: Text('dynamic_wallpaper_android_only'.tr()),
          ),
        ],
      );
    }

    return SettingsSubPageScaffold(
      showDivider: true,
      settings: [
        ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 20),
          title: Text(
            'dynamic_wallpaper_interval_title'.tr(),
            style: context.textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w500),
          ),
          subtitle: SettingsRadioListTile<int>(
            groups: _intervalOptions,
            groupBy: config.intervalMinutes,
            onRadioChanged: (value) {
              if (value != null) {
                service.configure(intervalMinutes: value);
              }
            },
          ),
        ),
        SettingsButtonListTile(
          icon: Icons.wallpaper_outlined,
          title: 'dynamic_wallpaper_picker_title'.tr(),
          subtileText: 'dynamic_wallpaper_picker_subtitle'.tr(namedArgs: {'count': selectedCount.toString()}),
          buttonText: 'dynamic_wallpaper_open_picker'.tr(),
          onButtonTap: selectedCount == 0 ? null : service.openPicker,
        ),
        SettingsButtonListTile(
          icon: Icons.clear_all_outlined,
          title: 'dynamic_wallpaper_selection_title'.tr(),
          subtileText: 'dynamic_wallpaper_selection_subtitle'.tr(namedArgs: {'count': selectedCount.toString()}),
          buttonText: 'dynamic_wallpaper_clear_selection'.tr(),
          onButtonTap: selectedCount == 0 ? null : service.clearSelection,
        ),
      ],
    );
  }
}
