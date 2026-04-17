import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:logging/logging.dart';
import 'package:native_video_player/native_video_player.dart';
import 'package:wakelock_plus/wakelock_plus.dart';

enum VideoPlaybackStatus { paused, playing, buffering, completed }

class VideoPlayerState {
  final Duration position;
  final Duration duration;
  final VideoPlaybackStatus status;

  const VideoPlayerState({required this.position, required this.duration, required this.status});

  VideoPlayerState copyWith({Duration? position, Duration? duration, VideoPlaybackStatus? status}) {
    return VideoPlayerState(
      position: position ?? this.position,
      duration: duration ?? this.duration,
      status: status ?? this.status,
    );
  }
}

const _defaultState = VideoPlayerState(
  position: Duration.zero,
  duration: Duration.zero,
  status: VideoPlaybackStatus.paused,
);

final videoPlayerProvider = StateNotifierProvider.autoDispose.family<VideoPlayerNotifier, VideoPlayerState, String>((
  ref,
  name,
) {
  return VideoPlayerNotifier();
});

class VideoPlayerNotifier extends StateNotifier<VideoPlayerState> {
  static final _log = Logger('VideoPlayerNotifier');

  VideoPlayerNotifier() : super(_defaultState);

  NativeVideoPlayerController? _controller;
  Timer? _bufferingTimer;
  Timer? _seekTimer;
  VideoPlaybackStatus? _holdStatus;

  @override
  void dispose() {
    _bufferingTimer?.cancel();
    _seekTimer?.cancel();
    WakelockPlus.disable();
    _controller = null;

    super.dispose();
  }

  void attachController(NativeVideoPlayerController controller) {
    _controller = controller;
  }

  Future<void> load(VideoSource source) async {
    _startBufferingTimer();
    try {
      await _controller?.loadVideoSource(source);
    } catch (e) {
      _log.severe('Error loading video source: $e');
    }
  }

  Future<void> pause() async {
    if (_controller == null) return;

    _bufferingTimer?.cancel();

    try {
      await _controller!.pause();
      await _flushSeek();
    } catch (e) {
      _log.severe('Error pausing video: $e');
    }
  }

  Future<void> play() async {
    if (_controller == null) return;

    try {
      await _flushSeek();
      await _controller!.play();
    } catch (e) {
      _log.severe('Error playing video: $e');
    }

    _startBufferingTimer();
  }

  Future<void> _flushSeek() async {
    final timer = _seekTimer;
    if (timer == null || !timer.isActive) return;

    timer.cancel();
    await _controller?.seekTo(state.position.inMilliseconds);
  }

  void seekTo(Duration position) {
    if (_controller == null || state.position == position) return;

    state = state.copyWith(position: position);

    if (_seekTimer?.isActive ?? false) return;

    _seekTimer = Timer(const Duration(milliseconds: 150), () {
      _controller?.seekTo(state.position.inMilliseconds);
    });
  }

  void toggle() {
    _holdStatus = null;

    switch (state.status) {
      case VideoPlaybackStatus.paused:
        play();
      case VideoPlaybackStatus.playing || VideoPlaybackStatus.buffering:
        pause();
      case VideoPlaybackStatus.completed:
        restart();
    }
  }

  /// Pauses playback and preserves the current status for later restoration.
  void hold() {
    if (_holdStatus != null) return;

    _holdStatus = state.status;
    pause();
  }

  /// Restores playback to the status before [hold] was called.
  void release() {
    final status = _holdStatus;
    _holdStatus = null;

    switch (status) {
      case VideoPlaybackStatus.playing || VideoPlaybackStatus.buffering:
        play();
      default:
    }
  }

  Future<void> restart() async {
    seekTo(Duration.zero);
    await play();
  }

  Future<void> setVolume(double volume) async {
    try {
      await _controller?.setVolume(volume);
    } catch (e) {
      _log.severe('Error setting volume: $e');
    }
  }

  Future<void> setLoop(bool loop) async {
    try {
      await _controller?.setLoop(loop);
    } catch (e) {
      _log.severe('Error setting loop: $e');
    }
  }

  void onNativePlaybackReady() {
    if (!mounted) return;

    final playbackInfo = _controller?.playbackInfo;
    final videoInfo = _controller?.videoInfo;

    if (playbackInfo == null || videoInfo == null) return;

    state = state.copyWith(
      position: Duration(milliseconds: playbackInfo.position),
      duration: Duration(milliseconds: videoInfo.duration),
      status: _mapStatus(playbackInfo.status),
    );
  }

  void onNativePositionChanged() {
    if (!mounted || (_seekTimer?.isActive ?? false)) return;

    final playbackInfo = _controller?.playbackInfo;
    if (playbackInfo == null) return;

    final position = Duration(milliseconds: playbackInfo.position);
    if (state.position == position) return;

    if (state.status == VideoPlaybackStatus.playing) _startBufferingTimer();

    state = state.copyWith(
      position: position,
      status: state.status == VideoPlaybackStatus.buffering ? VideoPlaybackStatus.playing : null,
    );
  }

  void onNativeStatusChanged() {
    if (!mounted) return;

    final playbackInfo = _controller?.playbackInfo;
    if (playbackInfo == null) return;

    final newStatus = _mapStatus(playbackInfo.status);
    switch (newStatus) {
      case VideoPlaybackStatus.playing:
        WakelockPlus.enable();
        _startBufferingTimer();
      default:
        onNativePlaybackEnded();
    }

    if (state.status != newStatus) state = state.copyWith(status: newStatus);
  }

  void onNativePlaybackEnded() {
    WakelockPlus.disable();
    _bufferingTimer?.cancel();
  }

  void _startBufferingTimer() {
    _bufferingTimer?.cancel();
    _bufferingTimer = Timer(const Duration(seconds: 1), () {
      if (mounted && state.status != VideoPlaybackStatus.completed) {
        state = state.copyWith(status: VideoPlaybackStatus.buffering);
      }
    });
  }

  static VideoPlaybackStatus _mapStatus(PlaybackStatus status) => switch (status) {
    PlaybackStatus.playing => VideoPlaybackStatus.playing,
    PlaybackStatus.paused => VideoPlaybackStatus.paused,
    PlaybackStatus.stopped => VideoPlaybackStatus.completed,
  };
}
