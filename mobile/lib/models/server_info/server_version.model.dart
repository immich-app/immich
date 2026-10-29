import 'package:immich_mobile/utils/semver.dart';
import 'package:openapi/api.dart';

class ServerVersion extends SemVer {
  final int featureLevel;

  const ServerVersion({
    required super.major,
    required super.minor,
    required super.patch,
    super.prerelease,
    this.featureLevel = 0,
  });

  ServerVersion.fromDto(ServerVersionResponseDto dto)
    : featureLevel = dto.featureLevel,
      super(major: dto.major, minor: dto.minor, patch: dto.patch_, prerelease: dto.prerelease);
}
