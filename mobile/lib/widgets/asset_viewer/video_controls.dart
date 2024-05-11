import 'dart:math';

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset_viewer/show_controls.provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';

/// The video controls for the [videPlayerControlsProvider]
class VideoControls extends ConsumerWidget {
  const VideoControls({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final duration =
        ref.watch(videoPlaybackValueProvider.select((v) => v.duration));
    final position =
        ref.watch(videoPlaybackValueProvider.select((v) => v.position));

    return AnimatedOpacity(
      opacity: ref.watch(showControlsProvider) ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 100),
      child: OrientationBuilder(
        builder: (context, orientation) => Container(
          padding: EdgeInsets.symmetric(
            horizontal: orientation == Orientation.portrait ? 12.0 : 64.0,
          ),
          color: Colors.black.withOpacity(0.4),
          child: Padding(
            padding: MediaQuery.of(context).orientation == Orientation.portrait
                ? const EdgeInsets.symmetric(horizontal: 12.0)
                : const EdgeInsets.symmetric(horizontal: 64.0),
            child: Row(
              children: [
                Text(
                  _formatDuration(position),
                  style: TextStyle(
                    fontSize: 14.0,
                    color: Colors.white.withOpacity(.75),
                    fontWeight: FontWeight.normal,
                  ),
                ),
                Expanded(
                  child: Slider(
                    value: duration == Duration.zero
                        ? 0.0
                        : min(
                            position.inMicroseconds /
                                duration.inMicroseconds *
                                100,
                            100,
                          ),
                    min: 0,
                    max: 100,
                    thumbColor: Colors.white,
                    activeColor: Colors.white,
                    inactiveColor: Colors.white.withOpacity(0.75),
                    onChanged: (position) {
                      ref.read(videoPlayerControlsProvider.notifier).position =
                          position;
                    },
                  ),
                ),
                Text(
                  _formatDuration(duration),
                  style: TextStyle(
                    fontSize: 14.0,
                    color: Colors.white.withOpacity(.75),
                    fontWeight: FontWeight.normal,
                  ),
                ),
                IconButton(
                  icon: Icon(
                    ref.watch(
                      videoPlayerControlsProvider.select((value) => value.mute),
                    )
                        ? Icons.volume_off
                        : Icons.volume_up,
                  ),
                  onPressed: () => ref
                      .read(videoPlayerControlsProvider.notifier)
                      .toggleMute(),
                  color: Colors.white,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatDuration(Duration position) {
    final ms = position.inMilliseconds;

    int seconds = ms ~/ 1000;
    final int hours = seconds ~/ 3600;
    seconds = seconds % 3600;
    final minutes = seconds ~/ 60;
    seconds = seconds % 60;

    final hoursString = hours >= 10
        ? '$hours'
        : hours == 0
            ? '00'
            : '0$hours';

    final minutesString = minutes >= 10
        ? '$minutes'
        : minutes == 0
            ? '00'
            : '0$minutes';

    final secondsString = seconds >= 10
        ? '$seconds'
        : seconds == 0
            ? '00'
            : '0$seconds';

    final formattedTime =
        '${hoursString == '00' ? '' : '$hoursString:'}$minutesString:$secondsString';

    return formattedTime;
  }
}
