import 'package:immich_mobile/constants/enums.dart';

class SlideshowConfig {
  final bool repeat;
  final int duration;
  final SlideshowLook look;
  final SlideshowDirection direction;

  const SlideshowConfig({
    this.repeat = true,
    this.duration = 5,
    this.look = SlideshowLook.blurredBackground,
    this.direction = SlideshowDirection.forward,
  });

  SlideshowConfig copyWith({bool? repeat, int? duration, SlideshowLook? look, SlideshowDirection? direction}) =>
      SlideshowConfig(
        repeat: repeat ?? this.repeat,
        duration: duration ?? this.duration,
        look: look ?? this.look,
        direction: direction ?? this.direction,
      );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SlideshowConfig &&
          other.repeat == repeat &&
          other.duration == duration &&
          other.look == look &&
          other.direction == direction);

  @override
  int get hashCode => Object.hash(repeat, duration, look, direction);

  @override
  String toString() => 'SlideshowConfig(repeat: $repeat, duration: $duration, look: $look, direction: $direction)';
}
