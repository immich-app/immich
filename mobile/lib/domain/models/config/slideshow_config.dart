import 'package:immich_mobile/constants/enums.dart';

class SlideshowConfig {
  final bool progressBar;
  final bool transition;
  final bool repeat;
  final int duration;
  final SlideshowLook look;
  final SlideshowDirection direction;

  const SlideshowConfig({
    this.progressBar = true,
    this.transition = true,
    this.repeat = true,
    this.duration = 5,
    this.look = SlideshowLook.contain,
    this.direction = SlideshowDirection.forward,
  });

  SlideshowConfig copyWith({
    bool? progressBar,
    bool? transition,
    bool? repeat,
    int? duration,
    SlideshowLook? look,
    SlideshowDirection? direction,
  }) => SlideshowConfig(
    progressBar: progressBar ?? this.progressBar,
    transition: transition ?? this.transition,
    repeat: repeat ?? this.repeat,
    duration: duration ?? this.duration,
    look: look ?? this.look,
    direction: direction ?? this.direction,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SlideshowConfig &&
          other.progressBar == progressBar &&
          other.transition == transition &&
          other.repeat == repeat &&
          other.duration == duration &&
          other.look == look &&
          other.direction == direction);

  @override
  int get hashCode => Object.hash(progressBar, transition, repeat, duration, look, direction);

  @override
  String toString() =>
      'SlideshowConfig(progressBar: $progressBar, transition: $transition, repeat: $repeat, duration: $duration, look: $look, direction: $direction)';
}
