import 'package:openapi/api.dart';

class ServerVersion {
  final int major;
  final int minor;
  final int patch;

  const ServerVersion({
    required this.major,
    required this.minor,
    required this.patch,
  });

  ServerVersion copyWith({
    int? major,
    int? minor,
    int? patch,
  }) {
    return ServerVersion(
      major: major ?? this.major,
      minor: minor ?? this.minor,
      patch: patch ?? this.patch,
    );
  }

  @override
  String toString() {
    return 'ServerVersion(major: $major, minor: $minor, patch: $patch)';
  }

  ServerVersion.fromDto(ServerVersionResponseDto dto)
      : major = dto.major,
        minor = dto.minor,
        patch = dto.patch_;

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerVersion &&
        other.major == major &&
        other.minor == minor &&
        other.patch == patch;
  }

  @override
  int get hashCode {
    return major.hashCode ^ minor.hashCode ^ patch.hashCode;
  }
}
