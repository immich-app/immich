import 'package:auto_route/auto_route.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/modules/settings/ui/advanced_settings/advanced_settings.dart';
import 'package:immich_mobile/modules/settings/ui/asset_list_settings/asset_list_settings.dart';
import 'package:immich_mobile/modules/settings/ui/local_storage_settings/local_storage_settings.dart';
import 'package:immich_mobile/modules/settings/ui/image_viewer_quality_setting/image_viewer_quality_setting.dart';
import 'package:immich_mobile/modules/settings/ui/notification_setting/notification_setting.dart';
import 'package:immich_mobile/modules/settings/ui/theme_setting/theme_setting.dart';

@RoutePage()
class SettingsPage extends HookConsumerWidget {
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          iconSize: 20,
          splashRadius: 24,
          onPressed: () => context.pop(),
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
        ),
        automaticallyImplyLeading: false,
        centerTitle: false,
        title: const Text(
          'setting_pages_app_bar_settings',
        ).tr(),
      ),
      body: ListView(
        children: [
          ...ListTile.divideTiles(
            context: context,
            tiles: [
              const ImageViewerQualitySetting(),
              const ThemeSetting(),
              const AssetListSettings(),
              const NotificationSetting(),
              // const ExperimentalSettings(),
              const LocalStorageSettings(),
              const AdvancedSettings(),
            ],
          ),
        ],
      ),
    );
  }
}
