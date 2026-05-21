import 'package:immich_mobile/constants/enums.dart';

class SlideshowConfig {
  final bool transition;
  final bool repeat;
  final int duration;
  final SlideshowLook look;
  final SlideshowDirection direction;

  const SlideshowConfig({
    this.transition = true,
    this.repeat = true,
    this.duration = 5,
    this.look = SlideshowLook.contain,
    this.direction = SlideshowDirection.forward,
  });

  SlideshowConfig copyWith({
    bool? transition,
    bool? repeat,
    int? duration,
    SlideshowLook? look,
    SlideshowDirection? direction,
  }) => SlideshowConfig(
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
          other.transition == transition &&
          other.repeat == repeat &&
          other.duration == duration &&
          other.look == look &&
          other.direction == direction);

  @override
  int get hashCode => Object.hash(transition, repeat, duration, look, direction);

  @override
  String toString() =>
      'SlideshowConfig(transition: $transition, repeat: $repeat, duration: $duration, look: $look, direction: $direction)';
}
