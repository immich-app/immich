import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/utils/hooks/app_settings_update_hook.dart';
import 'package:immich_mobile/widgets/settings/core/setting_info.dart';
import 'package:immich_mobile/widgets/settings/core/setting_section_header.dart';
import 'package:immich_mobile/widgets/settings/core/setting_switch_list_tile.dart';
import 'package:immich_mobile/widgets/settings/layouts/settings_card_layout.dart';

class ImageViewerQualitySetting extends HookConsumerWidget {
  const ImageViewerQualitySetting({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isPreview = useAppSettingsState(AppSettingsEnum.loadPreview);
    final isOriginal = useAppSettingsState(AppSettingsEnum.loadOriginal);
    return SettingsCardLayout(
      header: const SettingSectionHeader(
        title: 'setting_image_viewer_title',
        icon: Icons.image_outlined,
      ),
      children: [
        const SettingInfo(
          padding: EdgeInsets.symmetric(vertical: 4),
          text: 'setting_image_viewer_help',
        ),
        SettingSwitchListTile(
          valueNotifier: isPreview,
          title: 'setting_image_viewer_preview_title'.t(context: context),
          subtitle: 'setting_image_viewer_preview_subtitle'.t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        SettingSwitchListTile(
          valueNotifier: isOriginal,
          title: 'setting_image_viewer_original_title'.t(context: context),
          subtitle:
              'setting_image_viewer_original_subtitle'.t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
