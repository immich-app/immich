import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'slideshow.provider.g.dart';

enum SlideshowNavigationMode { descending, ascending, shuffle }

class SlideshowState {
  final bool isPlaying;
  final bool isPaused;
  final int delaySeconds;
  final bool repeat;
  final SlideshowNavigationMode navigation;
  final bool showControls;

  const SlideshowState({
    this.isPlaying = false,
    this.isPaused = false,
    this.delaySeconds = 5,
    this.repeat = true,
    this.navigation = SlideshowNavigationMode.descending,
    this.showControls = true,
  });

  SlideshowState copyWith({
    bool? isPlaying,
    bool? isPaused,
    int? delaySeconds,
    bool? repeat,
    SlideshowNavigationMode? navigation,
    bool? showControls,
  }) {
    return SlideshowState(
      isPlaying: isPlaying ?? this.isPlaying,
      isPaused: isPaused ?? this.isPaused,
      delaySeconds: delaySeconds ?? this.delaySeconds,
      repeat: repeat ?? this.repeat,
      navigation: navigation ?? this.navigation,
      showControls: showControls ?? this.showControls,
    );
  }
}

@riverpod
class SlideshowNotifier extends _$SlideshowNotifier {
  @override
  SlideshowState build() => const SlideshowState();

  void start() {
    state = state.copyWith(isPlaying: true, isPaused: false, showControls: true);
  }

  void pause() {
    if (!state.isPlaying) return;
    state = state.copyWith(isPaused: true);
  }

  void resume() {
    if (!state.isPlaying) return;
    state = state.copyWith(isPaused: false);
  }

  void stop() {
    state = state.copyWith(isPlaying: false, isPaused: false, showControls: true);
  }

  void setDelay(int seconds) {
    if (seconds < 1) return;
    state = state.copyWith(delaySeconds: seconds);
  }

  void setRepeat(bool repeat) {
    state = state.copyWith(repeat: repeat);
  }

  void setNavigation(SlideshowNavigationMode mode) {
    state = state.copyWith(navigation: mode);
  }

  void showControls() {
    if (!state.isPlaying) return;
    state = state.copyWith(showControls: true);
  }

  void hideControls() {
    if (!state.isPlaying) return;
    state = state.copyWith(showControls: false);
  }
}
