import 'package:immich_mobile/utils/semver.dart';
import 'package:openapi/api.dart';

class ServerVersion extends SemVer {
  final bool supportsPasskeys;

  const ServerVersion({
    required super.major,
    required super.minor,
    required super.patch,
    super.prerelease,
    this.supportsPasskeys = false,
  });

  ServerVersion.fromDto(ServerVersionResponseDto dto)
    : supportsPasskeys = dto.featureLevel >= ServerFeatureLevel.Passkeys.toJson(),
      super(major: dto.major, minor: dto.minor, patch: dto.patch_, prerelease: dto.prerelease);
}
