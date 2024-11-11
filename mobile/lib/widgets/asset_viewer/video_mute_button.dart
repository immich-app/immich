import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';

class VideoMuteButton extends ConsumerWidget {
  const VideoMuteButton({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
      icon: ref.watch(
        videoPlayerControlsProvider.select((value) => value.mute),
      )
          ? const Icon(Icons.volume_off)
          : const Icon(Icons.volume_up),
      onPressed: () =>
          ref.read(videoPlayerControlsProvider.notifier).toggleMute(),
      color: Colors.white,
    );
  }
}
