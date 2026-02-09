import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:media_kit/media_kit.dart';
import 'package:media_kit_video/media_kit_video.dart';

class MediaKitVideoPlayerView extends HookConsumerWidget {
  final void Function(Player player, VideoController controller) onViewReady;

  const MediaKitVideoPlayerView({super.key, required this.onViewReady});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final player = useMemoized(() => Player());
    final controller = useMemoized(() => VideoController(player));

    useEffect(() {
      onViewReady(player, controller);
      return player.dispose;
    }, [player, controller]);

    return Video(controller: controller, controls: NoVideoControls);
  }
}
