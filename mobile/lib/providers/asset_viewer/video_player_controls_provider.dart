import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_value_provider.dart';

class VideoPlaybackControls {
  const VideoPlaybackControls({
    required this.position,
    required this.pause,
    this.restarted = false,
  });

  final double position;
  final bool pause;
  final bool restarted;
}

final videoPlayerControlsProvider =
    StateNotifierProvider<VideoPlayerControls, VideoPlaybackControls>((ref) {
  return VideoPlayerControls(ref);
});

const videoPlayerControlsDefault =
    VideoPlaybackControls(position: 0, pause: false);

class VideoPlayerControls extends StateNotifier<VideoPlaybackControls> {
  VideoPlayerControls(this.ref) : super(videoPlayerControlsDefault);

  final Ref ref;

  VideoPlaybackControls get value => state;

  set value(VideoPlaybackControls value) {
    state = value;
  }

  void reset() {
    state = videoPlayerControlsDefault;
  }

  double get position => state.position;
  bool get paused => state.pause;

  set position(double value) {
    if (state.position == value) {
      return;
    }

    state = VideoPlaybackControls(position: value, pause: state.pause);
  }

  void pause() {
    if (state.pause) {
      return;
    }

    state = VideoPlaybackControls(position: state.position, pause: true);
  }

  void play() {
    if (!state.pause) {
      return;
    }

    state = VideoPlaybackControls(position: state.position, pause: false);
  }

  void togglePlay() {
    state =
        VideoPlaybackControls(position: state.position, pause: !state.pause);
  }

  void restart() {
    state =
        const VideoPlaybackControls(position: 0, pause: false, restarted: true);
    ref.read(videoPlaybackValueProvider.notifier).value =
        ref.read(videoPlaybackValueProvider.notifier).value.copyWith(
              state: VideoPlaybackState.playing,
              position: Duration.zero,
            );
  }
}
