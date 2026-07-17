enum SemVerType { major, minor, patch, prerelease }

class SemVer {
  final int major;
  final int minor;
  final int patch;
  final int? prerelease;

  const SemVer({required this.major, required this.minor, required this.patch, this.prerelease});

  @override
  String toString() {
    return '$major.$minor.$patch${prerelease == null ? '' : '-rc.$prerelease'}';
  }

  SemVer copyWith({int? major, int? minor, int? patch, int? prerelease}) {
    return SemVer(
      major: major ?? this.major,
      minor: minor ?? this.minor,
      patch: patch ?? this.patch,
      prerelease: prerelease ?? this.prerelease,
    );
  }

  static final _pattern = RegExp(r'^v?(\d+)\.(\d+)\.(\d+)(?:-rc\.(\d+))?(?:[-+].*)?$', caseSensitive: false);

  factory SemVer.fromString(String version) {
    final match = _pattern.firstMatch(version);
    if (match == null) {
      throw FormatException('Invalid semantic version string: $version');
    }

    final prerelease = match.group(4);
    return SemVer(
      major: int.parse(match.group(1)!),
      minor: int.parse(match.group(2)!),
      patch: int.parse(match.group(3)!),
      prerelease: prerelease == null ? null : int.parse(prerelease),
    );
  }

  bool operator >(SemVer other) {
    if (major != other.major) {
      return major > other.major;
    }
    if (minor != other.minor) {
      return minor > other.minor;
    }
    if (patch != other.patch) {
      return patch > other.patch;
    }
    return _comparePrerelease(other) > 0;
  }

  bool operator <(SemVer other) {
    if (major != other.major) {
      return major < other.major;
    }
    if (minor != other.minor) {
      return minor < other.minor;
    }
    if (patch != other.patch) {
      return patch < other.patch;
    }
    return _comparePrerelease(other) < 0;
  }

  int _comparePrerelease(SemVer other) {
    if (prerelease == other.prerelease) {
      return 0;
    }
    if (prerelease == null) {
      return 1;
    }
    if (other.prerelease == null) {
      return -1;
    }
    return prerelease!.compareTo(other.prerelease!);
  }

  bool operator >=(SemVer other) {
    return this > other || this == other;
  }

  bool operator <=(SemVer other) {
    return this < other || this == other;
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }

    return other is SemVer &&
        other.major == major &&
        other.minor == minor &&
        other.patch == patch &&
        other.prerelease == prerelease;
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
    if (prerelease != other.prerelease) {
      return SemVerType.prerelease;
    }

    return null;
  }

  @override
  int get hashCode => major.hashCode ^ minor.hashCode ^ patch.hashCode ^ prerelease.hashCode;
}
