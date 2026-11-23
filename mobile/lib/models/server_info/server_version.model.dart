import 'package:immich_mobile/utils/semver.dart';
import 'package:openapi/api.dart';

class ServerVersion extends SemVer {
  final bool supportsPasskeys;
  final bool supportsSyncPendingReset;

  const ServerVersion({
    required super.major,
    required super.minor,
    required super.patch,
    super.prerelease,
    this.supportsPasskeys = false,
    this.supportsSyncPendingReset = false,
  });

  ServerVersion.fromDto(ServerVersionResponseDto dto)
    : supportsPasskeys = dto.featureLevel >= ServerFeatureLevel.Passkeys.toJson(),
      supportsSyncPendingReset = dto.featureLevel >= ServerFeatureLevel.SyncPendingReset.toJson(),
      super(major: dto.major, minor: dto.minor, patch: dto.patch_, prerelease: dto.prerelease);
}
