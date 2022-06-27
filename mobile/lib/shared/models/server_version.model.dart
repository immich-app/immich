import 'dart:convert';

class ServerVersion {
  final int major;
  final int minor;
  final int patch;
  final int build;

  ServerVersion({
    required this.major,
    required this.minor,
    required this.patch,
    required this.build,
  });

  ServerVersion copyWith({
    int? major,
    int? minor,
    int? patch,
    int? build,
  }) {
    return ServerVersion(
      major: major ?? this.major,
      minor: minor ?? this.minor,
      patch: patch ?? this.patch,
      build: build ?? this.build,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'major': major,
      'minor': minor,
      'patch': patch,
      'build': build,
    };
  }

  factory ServerVersion.fromMap(Map<String, dynamic> map) {
    return ServerVersion(
      major: map['major']?.toInt() ?? 0,
      minor: map['minor']?.toInt() ?? 0,
      patch: map['patch']?.toInt() ?? 0,
      build: map['build']?.toInt() ?? 0,
    );
  }

  String toJson() => json.encode(toMap());

  factory ServerVersion.fromJson(String source) =>
      ServerVersion.fromMap(json.decode(source));

  @override
  String toString() {
    return 'ServerVersion(major: $major, minor: $minor, patch: $patch, build: $build)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ServerVersion &&
        other.major == major &&
        other.minor == minor &&
        other.patch == patch &&
        other.build == build;
  }

  @override
  int get hashCode {
    return major.hashCode ^ minor.hashCode ^ patch.hashCode ^ build.hashCode;
  }
}
