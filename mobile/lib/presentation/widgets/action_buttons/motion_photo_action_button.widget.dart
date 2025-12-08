import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/base_action_button.widget.dart';
import 'package:immich_mobile/providers/asset_viewer/is_motion_video_playing.provider.dart';

class MotionPhotoActionButton extends ConsumerWidget {
  const MotionPhotoActionButton({super.key, this.iconOnly = true, this.menuItem = false});

  final bool iconOnly;
  final bool menuItem;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isPlaying = ref.watch(isPlayingMotionVideoProvider);

    return BaseActionButton(
      iconData: isPlaying ? Icons.motion_photos_pause_outlined : Icons.play_circle_outline_rounded,
      label: "play_motion_photo".t(context: context),
      onPressed: ref.read(isPlayingMotionVideoProvider.notifier).toggle,
      iconOnly: iconOnly,
      menuItem: menuItem,
    );
  }
}
