import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_hooks/flutter_hooks.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/colors.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_controls_provider.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';
import 'package:immich_mobile/widgets/asset_viewer/formatted_duration.dart';

class VideoPosition extends HookConsumerWidget {
  const VideoPosition({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final (position, duration) = ref.watch(
      videoPlaybackValueProvider.select((v) => (v.position, v.duration)),
    );
    final wasPlaying = useRef<bool>(true);
    return duration == Duration.zero
        ? const _VideoPositionPlaceholder()
        : Column(
            children: [
              Padding(
                // align with slider's inherent padding
                padding: const EdgeInsets.symmetric(horizontal: 12.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    FormattedDuration(position),
                    FormattedDuration(duration),
                  ],
                ),
              ),
              Row(
                children: [
                  Expanded(
                    child: Slider(
                      value: min(
                        position.inMicroseconds / duration.inMicroseconds * 100,
                        100,
                      ),
                      min: 0,
                      max: 100,
                      thumbColor: Colors.white,
                      activeColor: Colors.white,
                      inactiveColor: whiteOpacity75,
                      onChangeStart: (value) {
                        final state =
                            ref.read(videoPlaybackValueProvider).state;
                        wasPlaying.value = state != VideoPlaybackState.paused;
                        ref.read(videoPlayerControlsProvider.notifier).pause();
                      },
                      onChangeEnd: (value) {
                        if (wasPlaying.value) {
                          ref.read(videoPlayerControlsProvider.notifier).play();
                        }
                      },
                      onChanged: (value) {
                        final inSeconds =
                            (duration * (value / 100.0)).inSeconds;
                        final position = inSeconds.toDouble();
                        ref
                            .read(videoPlayerControlsProvider.notifier)
                            .position = position;
                        // This immediately updates the slider position without waiting for the video to update
                        ref.read(videoPlaybackValueProvider.notifier).position =
                            Duration(seconds: inSeconds);
                      },
                    ),
                  ),
                ],
              ),
            ],
          );
  }
}

class _VideoPositionPlaceholder extends StatelessWidget {
  const _VideoPositionPlaceholder();

  static void _onChangedDummy(_) {}

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 12.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              FormattedDuration(Duration.zero),
              FormattedDuration(Duration.zero),
            ],
          ),
        ),
        Row(
          children: [
            Expanded(
              child: Slider(
                value: 0.0,
                min: 0,
                max: 100,
                thumbColor: Colors.white,
                activeColor: Colors.white,
                inactiveColor: whiteOpacity75,
                onChanged: _onChangedDummy,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
