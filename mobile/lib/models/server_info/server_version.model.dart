import 'package:immich_mobile/utils/semver.dart';
import 'package:openapi/api.dart';

class ServerVersion extends SemVer {
  const ServerVersion({required super.major, required super.minor, required super.patch, super.prerelease});

  ServerVersion.fromDto(ServerVersionResponseDto dto)
    : super(major: dto.major, minor: dto.minor, patch: dto.patch_, prerelease: dto.prerelease);

  bool isAtLeast({int major = 0, int minor = 0, int patch = 0, int? prerelease}) {
    return this >= SemVer(major: major, minor: minor, patch: patch, prerelease: prerelease);
  }
}
