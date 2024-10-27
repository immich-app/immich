class ServerVersion {
  final int major;
  final int minor;
  final int patch;

  const ServerVersion({
    required this.major,
    required this.minor,
    required this.patch,
  });

  ServerVersion copyWith({int? major, int? minor, int? patch}) {
    return ServerVersion(
      major: major ?? this.major,
      minor: minor ?? this.minor,
      patch: patch ?? this.patch,
    );
  }

  const ServerVersion.initial()
      : major = 1,
        minor = 1,
        patch = 1;

  @override
  String toString() =>
      'ServerVersion(major: $major, minor: $minor, patch: $patch)';

  @override
  bool operator ==(covariant ServerVersion other) {
    if (identical(this, other)) return true;

    return other.major == major && other.minor == minor && other.patch == patch;
  }

  @override
  int get hashCode => major.hashCode ^ minor.hashCode ^ patch.hashCode;
}
