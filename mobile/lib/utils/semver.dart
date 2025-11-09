enum SemVerType { major, minor, patch }

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
    if (version.toLowerCase().startsWith("v")) {
      version = version.substring(1);
    }

    final parts = version.split("-")[0].split('.');
    if (parts.length != 3) {
      throw FormatException('Invalid semantic version string: $version');
    }

    try {
      return SemVer(major: int.parse(parts[0]), minor: int.parse(parts[1]), patch: int.parse(parts[2]));
    } catch (e) {
      throw FormatException('Invalid semantic version string: $version');
    }
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

  SemVerType? differenceType(SemVer other) {
    if (major != other.major) {
      return SemVerType.major;
    }
    if (minor != other.minor) {
      return SemVerType.minor;
    }
    if (patch != other.patch) {
      return SemVerType.patch;
    }

    return null;
  }

  @override
  int get hashCode => major.hashCode ^ minor.hashCode ^ patch.hashCode;
}
