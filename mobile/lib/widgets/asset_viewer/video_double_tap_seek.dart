import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/asset_viewer/video_player_provider.dart';
import 'package:immich_mobile/providers/cast.provider.dart';

enum VideoDoubleTapSeekDirection { backward, forward }

const videoDoubleTapSeekStep = Duration(seconds: 10);
const _videoDoubleTapCenterDeadZoneWidth = 128.0;
const _videoDoubleTapOverlayDuration = Duration(milliseconds: 900);
const _videoDoubleTapRippleDuration = Duration(milliseconds: 550);

VideoDoubleTapSeekDirection? resolveVideoDoubleTapSeekDirection({
  required double tapX,
  required double viewportWidth,
  double centerDeadZoneWidth = _videoDoubleTapCenterDeadZoneWidth,
}) {
  if (viewportWidth <= 0) {
    return null;
  }

  final halfDeadZone = math.min(centerDeadZoneWidth / 2, viewportWidth / 4);
  final centerX = viewportWidth / 2;

  if (tapX < centerX - halfDeadZone) {
    return VideoDoubleTapSeekDirection.backward;
  }

  if (tapX > centerX + halfDeadZone) {
    return VideoDoubleTapSeekDirection.forward;
  }

  return null;
}

Duration _clampDuration(Duration value, Duration max) {
  if (value < Duration.zero) {
    return Duration.zero;
  }

  if (max > Duration.zero && value > max) {
    return max;
  }

  return value;
}

void triggerVideoDoubleTapSeek(
  WidgetRef ref, {
  required String playerId,
  required double tapX,
  required double viewportWidth,
  Duration step = videoDoubleTapSeekStep,
}) {
  final direction = resolveVideoDoubleTapSeekDirection(tapX: tapX, viewportWidth: viewportWidth);
  if (direction == null) {
    return;
  }

  final isForward = direction == VideoDoubleTapSeekDirection.forward;
  final signedStep = isForward ? step : -step;

  final cast = ref.read(castProvider);
  if (cast.isCasting) {
    if (cast.duration <= Duration.zero) {
      return;
    }

    final target = _clampDuration(cast.currentTime + signedStep, cast.duration);
    if (target == cast.currentTime) {
      return;
    }

    ref.read(castProvider.notifier).seekTo(target);
    ref.read(videoDoubleTapSeekIndicatorProvider(playerId).notifier).show(direction, step);
    return;
  }

  final state = ref.read(videoPlayerProvider(playerId));
  if (state.duration <= Duration.zero) {
    return;
  }

  final target = _clampDuration(state.position + signedStep, state.duration);
  if (target == state.position) {
    return;
  }

  ref.read(videoPlayerProvider(playerId).notifier).seekTo(target);
  ref.read(videoDoubleTapSeekIndicatorProvider(playerId).notifier).show(direction, step);
}

@immutable
class VideoDoubleTapSeekIndicatorState {
  final VideoDoubleTapSeekDirection direction;
  final Duration total;
  final int sequence;

  const VideoDoubleTapSeekIndicatorState({required this.direction, required this.total, required this.sequence});
}

class VideoDoubleTapSeekIndicatorNotifier extends StateNotifier<VideoDoubleTapSeekIndicatorState?> {
  VideoDoubleTapSeekIndicatorNotifier() : super(null);

  Timer? _hideTimer;
  int _sequence = 0;

  @override
  void dispose() {
    _hideTimer?.cancel();
    super.dispose();
  }

  void show(VideoDoubleTapSeekDirection direction, Duration amount) {
    final current = state;
    final total = current != null && current.direction == direction ? current.total + amount : amount;

    state = VideoDoubleTapSeekIndicatorState(direction: direction, total: total, sequence: ++_sequence);

    _hideTimer?.cancel();
    _hideTimer = Timer(_videoDoubleTapOverlayDuration, () => state = null);
  }
}

final videoDoubleTapSeekIndicatorProvider = StateNotifierProvider.autoDispose
    .family<VideoDoubleTapSeekIndicatorNotifier, VideoDoubleTapSeekIndicatorState?, String>((ref, _) {
      return VideoDoubleTapSeekIndicatorNotifier();
    });

class VideoDoubleTapSeekOverlay extends ConsumerWidget {
  final String playerId;

  const VideoDoubleTapSeekOverlay({super.key, required this.playerId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(videoDoubleTapSeekIndicatorProvider(playerId));
    if (state == null) {
      return const SizedBox.shrink();
    }

    final isForward = state.direction == VideoDoubleTapSeekDirection.forward;
    final alignment = isForward ? Alignment.centerRight : Alignment.centerLeft;
    final icon = isForward ? Icons.fast_forward_rounded : Icons.fast_rewind_rounded;
    final label = '${isForward ? '+' : '-'}${state.total.inSeconds.abs()}s';

    return IgnorePointer(
      child: LayoutBuilder(
        builder: (context, constraints) {
          final halfWidth = constraints.maxWidth / 2;
          final diameter = math.max(halfWidth * 1.9, constraints.maxHeight * 1.2);

          return Stack(
            children: [
              Align(
                alignment: alignment,
                child: FractionallySizedBox(
                  widthFactor: 0.5,
                  heightFactor: 1,
                  child: ClipRect(
                    child: TweenAnimationBuilder<double>(
                      key: ValueKey(state.sequence),
                      tween: Tween(begin: 0, end: 1),
                      duration: _videoDoubleTapRippleDuration,
                      curve: Curves.easeOutCubic,
                      builder: (context, progress, _) {
                        final fade = 1 - Curves.easeIn.transform(progress);
                        final scale = 0.3 + progress;

                        return Stack(
                          fit: StackFit.expand,
                          children: [
                            Positioned(
                              left: isForward ? null : -diameter * 0.45,
                              right: isForward ? -diameter * 0.45 : null,
                              top: (constraints.maxHeight - diameter) / 2,
                              child: Opacity(
                                opacity: 0.24 * fade,
                                child: Transform.scale(
                                  scale: scale,
                                  child: Container(
                                    width: diameter,
                                    height: diameter,
                                    decoration: BoxDecoration(
                                      shape: BoxShape.circle,
                                      gradient: RadialGradient(
                                        colors: [
                                          Colors.white.withValues(alpha: 0.8),
                                          Colors.white.withValues(alpha: 0.24),
                                          Colors.transparent,
                                        ],
                                        stops: const [0.0, 0.45, 1.0],
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      },
                    ),
                  ),
                ),
              ),
              Align(
                alignment: Alignment(isForward ? 0.52 : -0.52, 0),
                child: TweenAnimationBuilder<double>(
                  key: ValueKey('content-${state.sequence}'),
                  tween: Tween(begin: 0, end: 1),
                  duration: _videoDoubleTapRippleDuration,
                  curve: Curves.easeOutCubic,
                  builder: (context, progress, child) {
                    final fade = 1 - Curves.easeIn.transform(progress);
                    return Opacity(
                      opacity: fade,
                      child: Transform.scale(scale: 0.92 + (progress * 0.08), child: child),
                    );
                  },
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.34),
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.14)),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(icon, color: Colors.white, size: 32),
                          const SizedBox(height: 4),
                          Text(
                            label,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w700,
                              shadows: [Shadow(color: Colors.black87, blurRadius: 8)],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
