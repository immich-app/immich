import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/widgets/asset_viewer/video_position.dart';

/// The video controls for the [videoPlayerControlsProvider]
class VideoControls extends ConsumerWidget {
  const VideoControls({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isPortrait = context.orientation == Orientation.portrait;
    return isPortrait
        ? const VideoPosition()
        : const Padding(
            padding: EdgeInsets.symmetric(horizontal: 60.0),
            child: VideoPosition(),
          );
  }
}
