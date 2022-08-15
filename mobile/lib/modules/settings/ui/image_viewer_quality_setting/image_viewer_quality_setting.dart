import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/settings/ui/image_viewer_quality_setting/three_stage_loading.dart';

class ImageViewerQualitySetting extends StatelessWidget {
  const ImageViewerQualitySetting({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ExpansionTile(
      textColor: Theme.of(context).primaryColor,
      title: const Text(
        'theme_setting_image_viewer_quality_title',
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ).tr(),
      subtitle: const Text(
        'theme_setting_image_viewer_quality_subtitle',
        style: TextStyle(
          fontSize: 13,
        ),
      ).tr(),
      children: const [
        ThreeStageLoading(),
      ],
    );
  }
}
