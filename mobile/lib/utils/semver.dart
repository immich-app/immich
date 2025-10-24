class SemVer {
  final int major;
  final int minor;
  final int patch;

  const SemVer({required this.major, required this.minor, required this.patch});

  @override
  String toString() {
    return '$major.$minor.$patch';
  }

  SemVer copyWith({int? major, int? minor, int? patch}) {
    return SemVer(major: major ?? this.major, minor: minor ?? this.minor, patch: patch ?? this.patch);
  }

  factory SemVer.fromString(String version) {
    final parts = version.split("-")[0].split('.');
    return SemVer(major: int.parse(parts[0]), minor: int.parse(parts[1]), patch: int.parse(parts[2]));
  }

  bool operator >(SemVer other) {
    if (major != other.major) {
      return major > other.major;
    }
    if (minor != other.minor) {
      return minor > other.minor;
    }
    return patch > other.patch;
  }

  bool operator <(SemVer other) {
    if (major != other.major) {
      return major < other.major;
    }
    if (minor != other.minor) {
      return minor < other.minor;
    }
    return patch < other.patch;
  }

  bool operator >=(SemVer other) {
    return this > other || this == other;
  }

  bool operator <=(SemVer other) {
    return this < other || this == other;
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is SemVer && other.major == major && other.minor == minor && other.patch == patch;
  }

  @override
  int get hashCode => major.hashCode ^ minor.hashCode ^ patch.hashCode;
}
