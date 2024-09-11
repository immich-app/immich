import 'package:flutter/material.dart';
import 'package:immich_mobile/widgets/settings/asset_viewer_settings/image_viewer_quality_setting.dart';
import 'package:immich_mobile/widgets/settings/settings_sub_page_scaffold.dart';
import 'video_viewer_settings.dart';

class AssetViewerSettings extends StatelessWidget {
  const AssetViewerSettings({
    super.key,
  });

  @override
  Widget build(BuildContext context) {
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
