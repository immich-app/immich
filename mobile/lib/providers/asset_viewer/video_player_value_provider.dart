import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:media_kit/media_kit.dart';

enum VideoPlaybackState { initializing, paused, playing, buffering, completed }

class VideoPlaybackValue {
  /// The current position of the video
  final Duration position;

  /// The total duration of the video
  final Duration duration;

  /// The current state of the video playback
  final VideoPlaybackState state;

  /// The volume of the video
  final double volume;

  const VideoPlaybackValue({required this.position, required this.duration, required this.state, required this.volume});

  factory VideoPlaybackValue.fromPlayer(Player player) {
    final state = player.state;
    VideoPlaybackState status;
    if (state.completed) {
      status = VideoPlaybackState.completed;
    } else if (state.playing) {
      status = VideoPlaybackState.playing;
    } else {
      status = VideoPlaybackState.paused;
    }

    return VideoPlaybackValue(position: state.position, duration: state.duration, state: status, volume: state.volume);
  }

  VideoPlaybackValue copyWith({Duration? position, Duration? duration, VideoPlaybackState? state, double? volume}) {
    return VideoPlaybackValue(
      position: position ?? this.position,
      duration: duration ?? this.duration,
      state: state ?? this.state,
      volume: volume ?? this.volume,
    );
  }
}

const VideoPlaybackValue videoPlaybackValueDefault = VideoPlaybackValue(
  position: Duration.zero,
  duration: Duration.zero,
  state: VideoPlaybackState.initializing,
  volume: 0.0,
);

final videoPlaybackValueProvider = StateNotifierProvider<VideoPlaybackValueState, VideoPlaybackValue>((ref) {
  return VideoPlaybackValueState(ref);
});

class VideoPlaybackValueState extends StateNotifier<VideoPlaybackValue> {
  VideoPlaybackValueState(this.ref) : super(videoPlaybackValueDefault);

  final Ref ref;

  VideoPlaybackValue get value => state;

  set value(VideoPlaybackValue value) {
    state = value;
  }

  set position(Duration value) {
    if (state.position == value) return;
    state = state.copyWith(position: value);
  }

  set duration(Duration value) {
    if (state.duration == value) return;
    state = state.copyWith(duration: value);
  }

  set status(VideoPlaybackState value) {
    if (state.state == value) return;
    state = VideoPlaybackValue(position: state.position, duration: state.duration, state: value, volume: state.volume);
  }

  void reset() {
    state = videoPlaybackValueDefault;
  }
}
