// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SessionCreateDto {
  const SessionCreateDto({
    this.deviceOs = const Optional.absent(),
    this.deviceType = const Optional.absent(),
    this.duration = const Optional.absent(),
  });

  /// Device OS
  final Optional<String> deviceOs;

  /// Device type
  final Optional<String> deviceType;

  /// Session duration in seconds
  final Optional<int> duration;

  static SessionCreateDto? fromJson(dynamic value) {
    ApiCompat.upgrade<SessionCreateDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      deviceOs: json.containsKey(r'deviceOS') ? Optional.present(json[r'deviceOS'] as String) : const Optional.absent(),
      deviceType: json.containsKey(r'deviceType')
          ? Optional.present(json[r'deviceType'] as String)
          : const Optional.absent(),
      duration: json.containsKey(r'duration') ? Optional.present(json[r'duration'] as int) : const Optional.absent(),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (deviceOs case Present(:final value)) {
      json[r'deviceOS'] = value;
    }
    if (deviceType case Present(:final value)) {
      json[r'deviceType'] = value;
    }
    if (duration case Present(:final value)) {
      json[r'duration'] = value;
    }
    return json;
  }

  SessionCreateDto copyWith({Optional<String>? deviceOs, Optional<String>? deviceType, Optional<int>? duration}) {
    return .new(
      deviceOs: deviceOs ?? this.deviceOs,
      deviceType: deviceType ?? this.deviceType,
      duration: duration ?? this.duration,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SessionCreateDto &&
            deviceOs == other.deviceOs &&
            deviceType == other.deviceType &&
            duration == other.duration);
  }

  @override
  int get hashCode {
    return Object.hashAll([deviceOs, deviceType, duration]);
  }

  @override
  String toString() => 'SessionCreateDto(deviceOs=$deviceOs, deviceType=$deviceType, duration=$duration)';
}
