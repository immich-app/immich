import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/ui/asset_viewer_settings/image_viewer_quality_setting.dart';
import 'package:immich_mobile/modules/settings/ui/settings_sub_page_scaffold.dart';
import 'video_viewer_settings.dart';

class AssetViewerSettings extends HookConsumerWidget {
  const AssetViewerSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assetViewerSetting = [
      const ImageViewerQualitySetting(),
      const VideoViewerSettings(),
    ];

    return SettingsSubPageScaffold(
      settings: assetViewerSetting,
      showDivider: true,
    );
  }
}
