import 'package:immich_mobile/utils/semver.dart';
import 'package:openapi/api.dart';

class ServerVersion extends SemVer {
  final bool supportsPasskeys;
  final bool supportsSyncAlbumsV3;

  const ServerVersion({
    required super.major,
    required super.minor,
    required super.patch,
    super.prerelease,
    this.supportsPasskeys = false,
    this.supportsSyncAlbumsV3 = false,
  });

  ServerVersion.fromDto(ServerVersionResponseDto dto)
    : supportsPasskeys = dto.featureLevel >= ServerFeatureLevel.Passkeys.toJson(),
      supportsSyncAlbumsV3 = dto.featureLevel >= ServerFeatureLevel.SyncAlbumsV3.toJson(),
      super(major: dto.major, minor: dto.minor, patch: dto.patch_, prerelease: dto.prerelease);
}
