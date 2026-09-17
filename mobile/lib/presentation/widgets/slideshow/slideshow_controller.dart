import 'dart:async';

import 'package:flutter/widgets.dart';

/// The shared instance behavior between individual slideshow components
abstract interface class SlideshowDelegate {
  /// Provides the index of the slide to display after the slide at [index]. A returned `null` index indicates the slideshow should terminate "next"
  int? nextIndexAfter(int index);

  /// Provides the playback position of the video slide at [index], or null if the slide is not a video
  Duration? videoProgressOf(int index);

  /// Provides the completion state of the video slide at [index], or false if the slide is not a video
  bool isVideoCompleted(int index);

  /// Called when the slideshow starts or stops playing
  void onPlaybackChanged(int index, bool playing);

  /// Called to indicate the slide corresponding to [index] should be displayed, transitioning from [prevIndex]
  ///
  /// **NOTE:** The receiver MUST call [SlideshowController.didCompleteShowSlide] when the slide became "ready"
  void onShowSlide(int index, int prevIndex);
}

/// Manages Flutter slideshow rendering
///
/// After constructing, call [goToNextSlide] to begin the slideshow
class SlideshowController extends ChangeNotifier {
  final SlideshowDelegate delegate;

  late final AnimationController _animationController;

  /// The index of the currently displayed slide
  int _currentIndex;

  /// The index of the expected next displayed slide
  int? _nextIndex;

  bool _paused = false;
  bool _shouldZoomOut = true;

  /// The last recorded video playback position
  Duration _lastVideoPosition = Duration.zero;

  SlideshowController({
    required TickerProvider vsync,
    required Duration slideDuration,
    required int initialIndex,
    required this.delegate,
  }) : _currentIndex = initialIndex {
    _animationController =
        AnimationController(
          vsync: vsync,
          duration: slideDuration,
          // This `AnimationController` serves as the actual slideshow timer, so we must ignore reduce motion
          animationBehavior: AnimationBehavior.preserve,
        )..addStatusListener((status) {
          if (status == AnimationStatus.completed) {
            _onAnimationElapsed();
          }
        });

    // We want to go to the first slide
    _nextIndex = initialIndex;
  }

  /// The slide currently on screen
  int get currentIndex => _currentIndex;

  /// The slide to be displayed next. Null if the slideshow will end after this slide
  int? get nextIndex => _nextIndex;

  /// True when the user paused or the slideshow has completed
  bool get paused => _paused;

  /// Ken Burns zoom animation direction
  ///
  /// Each slide transitions from zooming in/out to out/in
  bool get shouldZoomOut => _shouldZoomOut;

  /// The slideshow clock/progress indicator. Its value, [0.0, 1.0] represents the progress through the duration of the current slide
  Animation<double> get progress => _animationController;

  /// The display duration of a single slide. Setting a new duration mid-animation will continue from the current percentage completion at the new pace
  set slideDuration(Duration duration) {
    _animationController.duration = duration;

    if (!_paused && _animationController.isAnimating) {
      unawaited(_animationController.forward());
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  /// Stops the slideshow at its current position
  void pause() {
    _paused = true;
    _animationController.stop();

    delegate.onPlaybackChanged(_currentIndex, false);

    notifyListeners();
  }

  /// Resume the slideshow from its current position
  void resume() {
    _paused = false;
    notifyListeners();

    if (delegate.isVideoCompleted(_currentIndex)) {
      goToNextSlide();
      return;
    }

    if (_animationController.isCompleted) {
      // If slide hit the end, restart it from 0
      _animationController.value = 0.0;
    }

    unawaited(_animationController.forward());

    delegate.onPlaybackChanged(_currentIndex, true);
  }

  /// Immediately transitions to the previously determined next slide
  ///
  /// If there is no [_nextIndex], pauses the slideshow
  void goToNextSlide() {
    _animationController.stop();

    final targetIndex = _nextIndex;

    if (targetIndex == null) {
      _paused = true;

      notifyListeners();
      return;
    }

    delegate.onShowSlide(targetIndex, _currentIndex);
  }

  /// Indicates the slide at [index] is now displayed
  void didCompleteShowSlide(int index) {
    _currentIndex = index;
    _nextIndex = delegate.nextIndexAfter(index);

    _shouldZoomOut = !_shouldZoomOut;

    if (delegate.videoProgressOf(index) != null) {
      // Visiting a video immediately starts playback (as part of NativeVideoPlayer)
      // We do not want to unpause outside of videos
      _paused = false;
    }

    _startSlideTimer();

    notifyListeners();
  }

  /// Indicates the currently displayed video slide finished playback
  void didCompleteVideo() {
    if (!_paused) {
      goToNextSlide();
    }
  }

  /// Recalculates the next slide index
  void recalculateNextIndex() {
    _nextIndex = delegate.nextIndexAfter(_currentIndex);

    notifyListeners();
  }

  /// Begin the timer for the current slide
  void _startSlideTimer() {
    _lastVideoPosition = delegate.videoProgressOf(_currentIndex) ?? Duration.zero;

    if (_paused) {
      _animationController.value = 0.0;
    } else {
      unawaited(_animationController.forward(from: 0.0));
    }
  }

  void _onAnimationElapsed() {
    final videoPosition = delegate.videoProgressOf(_currentIndex);

    if (videoPosition != null && videoPosition != _lastVideoPosition) {
      // Video progress has been made and thus is not stalled
      _lastVideoPosition = videoPosition;

      // Restart the slide timer in case the video stalls in the future
      unawaited(_animationController.forward(from: 0.0));

      return;
    }

    goToNextSlide();
  }
}
