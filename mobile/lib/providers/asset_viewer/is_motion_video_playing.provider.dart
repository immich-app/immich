import 'package:hooks_riverpod/hooks_riverpod.dart';

/// Whether to display the video part of a motion photo
final isPlayingMotionVideoProvider = StateNotifierProvider<IsPlayingMotionVideo, bool>((ref) {
  return IsPlayingMotionVideo();
});

class IsPlayingMotionVideo extends StateNotifier<bool> {
  IsPlayingMotionVideo() : super(false);

  bool get playing => state;

  set playing(bool value) {
    state = value;
  }

  void toggle() {
    state = !state;
  }
}
