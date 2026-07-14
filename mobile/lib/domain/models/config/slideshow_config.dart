import 'package:immich_mobile/constants/enums.dart';

class SlideshowConfig {
  final bool repeat;
  final int duration;
  final SlideshowLook look;
  final SlideshowDirection direction;
  final SlideshowVideoMode videoMode;

  const SlideshowConfig({
    this.repeat = true,
    this.duration = 5,
    this.look = SlideshowLook.blurredBackground,
    this.direction = SlideshowDirection.forward,
    this.videoMode = SlideshowVideoMode.playToEnd,
  });

  SlideshowConfig copyWith({
    bool? repeat,
    int? duration,
    SlideshowLook? look,
    SlideshowDirection? direction,
    SlideshowVideoMode? videoMode,
  }) => SlideshowConfig(
    repeat: repeat ?? this.repeat,
    duration: duration ?? this.duration,
    look: look ?? this.look,
    direction: direction ?? this.direction,
    videoMode: videoMode ?? this.videoMode,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is SlideshowConfig &&
          other.repeat == repeat &&
          other.duration == duration &&
          other.look == look &&
          other.direction == direction &&
          other.videoMode == videoMode);

  @override
  int get hashCode => Object.hash(repeat, duration, look, direction, videoMode);

  @override
  String toString() =>
      'SlideshowConfig(repeat: $repeat, duration: $duration, look: $look, direction: $direction, videoMode: $videoMode)';
}
