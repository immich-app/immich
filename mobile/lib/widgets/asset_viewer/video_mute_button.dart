import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';

/// The video controls for the [videPlayerControlsProvider]
class VideoMuteButton extends ConsumerWidget {
  const VideoMuteButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
      icon: Icon(
        ref.watch(
          videoPlayerControlsProvider.select((value) => value.mute),
        )
            ? Icons.volume_off
            : Icons.volume_up,
      ),
      onPressed: () =>
          ref.read(videoPlayerControlsProvider.notifier).toggleMute(),
      color: Colors.white,
    );
  }
}
