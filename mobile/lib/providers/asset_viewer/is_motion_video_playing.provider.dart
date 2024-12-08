import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Whether to display the video part of a motion photo
final isPlayingMotionVideoProvider =
    StateNotifierProvider<IsPlayingMotionVideo, bool>((ref) {
  return IsPlayingMotionVideo(ref);
});

class IsPlayingMotionVideo extends StateNotifier<bool> {
  IsPlayingMotionVideo(this.ref) : super(false);

  final Ref ref;

  bool get playing => state;

  set playing(bool value) {
    state = value;
  }

  void toggle() {
    state = !state;
  }
}
