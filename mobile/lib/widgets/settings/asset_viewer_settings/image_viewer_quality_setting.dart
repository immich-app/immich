import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/widgets/settings/setting_group_title.dart';
import 'package:immich_mobile/widgets/settings/settings_switch_list_tile.dart';

class ImageViewerQualitySetting extends HookConsumerWidget {
  const ImageViewerQualitySetting({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isPreview = useState(ref.read(appConfigProvider).image.loadPreview);
    final isOriginal = useState(ref.read(appConfigProvider).image.loadOriginal);
    useValueChanged<bool, void>(isPreview.value, (_, __) {
      ref.read(settingsProvider).write(.imageLoadPreview, isPreview.value);
    });
    useValueChanged<bool, void>(isOriginal.value, (_, __) {
      ref.read(settingsProvider).write(.imageLoadOriginal, isOriginal.value);
    });

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SettingGroupTitle(
          title: "photos".t(context: context),
          icon: Icons.image_outlined,
          subtitle: "setting_image_viewer_help".t(context: context),
        ),
        SettingsSwitchListTile(
          valueNotifier: isPreview,
          title: "setting_image_viewer_preview_title".t(context: context),
          subtitle: "setting_image_viewer_preview_subtitle".t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
        SettingsSwitchListTile(
          valueNotifier: isOriginal,
          title: "setting_image_viewer_original_title".t(context: context),
          subtitle: "setting_image_viewer_original_subtitle".t(context: context),
          onChanged: (_) => ref.invalidate(appSettingsServiceProvider),
        ),
      ],
    );
  }
}
