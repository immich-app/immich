import 'package:flutter/material.dart';
import 'package:immich_mobile/modules/settings/ui/image_viewer_quality_setting/three_stage_loading.dart';

class ImageViewerQualitySetting extends StatelessWidget {
  const ImageViewerQualitySetting({
    Key? key,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const ExpansionTile(
      title: Text(
        'Image viewer quality',
        style: TextStyle(
          fontWeight: FontWeight.bold,
        ),
      ),
      subtitle: Text(
        'Adjust the quality of the detail image viewer',
        style: TextStyle(
          fontSize: 13,
        ),
      ),
      children: [
        ThreeStageLoading(),
      ],
    );
  }
}
