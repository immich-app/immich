import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:video_player/video_player.dart';

enum VideoPlaybackState {
  initializing,
  paused,
  playing,
  buffering,
  completed,
}

class VideoPlaybackValue {
  /// The current position of the video
  final Duration position;

  /// The total duration of the video
  final Duration duration;

  /// The current state of the video playback
  final VideoPlaybackState state;

  /// The volume of the video
  final double volume;

  VideoPlaybackValue({
    required this.position,
    required this.duration,
    required this.state,
    required this.volume,
  });

  factory VideoPlaybackValue.fromController(VideoPlayerController? controller) {
    final video = controller?.value;
    late VideoPlaybackState s;
    if (video == null) {
      s = VideoPlaybackState.initializing;
    } else if (video.isCompleted) {
      s = VideoPlaybackState.completed;
    } else if (video.isPlaying) {
      s = VideoPlaybackState.playing;
    } else if (video.isBuffering) {
      s = VideoPlaybackState.buffering;
    } else {
      s = VideoPlaybackState.paused;
    }

    return VideoPlaybackValue(
      position: video?.position ?? Duration.zero,
      duration: video?.duration ?? Duration.zero,
      state: s,
      volume: video?.volume ?? 0.0,
    );
  }

  factory VideoPlaybackValue.uninitialized() {
    return VideoPlaybackValue(
      position: Duration.zero,
      duration: Duration.zero,
      state: VideoPlaybackState.initializing,
      volume: 0.0,
    );
  }
}

final videoPlaybackValueProvider =
    StateNotifierProvider<VideoPlaybackValueState, VideoPlaybackValue>((ref) {
  return VideoPlaybackValueState(ref);
});

class VideoPlaybackValueState extends StateNotifier<VideoPlaybackValue> {
  VideoPlaybackValueState(this.ref)
      : super(
          VideoPlaybackValue.uninitialized(),
        );

  final Ref ref;

  VideoPlaybackValue get value => state;

  set value(VideoPlaybackValue value) {
    state = value;
  }

  set position(Duration value) {
    state = VideoPlaybackValue(
      position: value,
      duration: state.duration,
      state: state.state,
      volume: state.volume,
    );
  }
}
