import 'package:hooks_riverpod/hooks_riverpod.dart';

class VideoPlaybackValue {
  VideoPlaybackValue({required this.position, required this.duration});

  final Duration position;
  final Duration duration;
}

final videoPlaybackValueProvider =
    StateNotifierProvider<VideoPlaybackValueState, VideoPlaybackValue>((ref) {
  return VideoPlaybackValueState(ref);
});

class VideoPlaybackValueState extends StateNotifier<VideoPlaybackValue> {
  VideoPlaybackValueState(this.ref)
      : super(
          VideoPlaybackValue(
            position: Duration.zero,
            duration: Duration.zero,
          ),
        );

  final Ref ref;

  VideoPlaybackValue get value => state;

  set value(VideoPlaybackValue value) {
    state = value;
  }

  set position(Duration value) {
    state = VideoPlaybackValue(position: value, duration: state.duration);
  }
}
