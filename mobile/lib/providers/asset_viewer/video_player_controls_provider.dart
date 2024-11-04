import 'package:hooks_riverpod/hooks_riverpod.dart';

class VideoPlaybackControls {
  const VideoPlaybackControls({
    required this.position,
    required this.mute,
    required this.pause,
  });

  final double position;
  final bool mute;
  final bool pause;
}

final videoPlayerControlsProvider =
    StateNotifierProvider<VideoPlayerControls, VideoPlaybackControls>((ref) {
  return VideoPlayerControls(ref);
});

const videoPlayerControlsDefault = VideoPlaybackControls(
  position: 0,
  pause: false,
  mute: false,
);

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
  bool get mute => state.mute;

  set position(double value) {
    if (state.position == value) {
      return;
    }

    state = VideoPlaybackControls(
      position: value,
      mute: state.mute,
      pause: state.pause,
    );
  }

  set mute(bool value) {
    if (state.mute == value) {
      return;
    }

    state = VideoPlaybackControls(
      position: state.position,
      mute: value,
      pause: state.pause,
    );
  }

  void toggleMute() {
    state = VideoPlaybackControls(
      position: state.position,
      mute: !state.mute,
      pause: state.pause,
    );
  }

  void pause() {
    if (state.pause) {
      return;
    }

    state = VideoPlaybackControls(
      position: state.position,
      mute: state.mute,
      pause: true,
    );
  }

  void play() {
    if (!state.pause) {
      return;
    }

    state = VideoPlaybackControls(
      position: state.position,
      mute: state.mute,
      pause: false,
    );
  }

  void togglePlay() {
    state = VideoPlaybackControls(
      position: state.position,
      mute: state.mute,
      pause: !state.pause,
    );
  }

  void restart() {
    state = VideoPlaybackControls(
      position: 0,
      mute: state.mute,
      pause: false,
    );
  }
}
