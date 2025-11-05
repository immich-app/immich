import 'package:immich_mobile/utils/semver.dart';
import 'package:openapi/api.dart';

class ServerVersion extends SemVer {
  const ServerVersion({required super.major, required super.minor, required super.patch});

  @override
  String toString() {
    return 'ServerVersion(major: $major, minor: $minor, patch: $patch)';
  }

  ServerVersion.fromDto(ServerVersionResponseDto dto) : super(major: dto.major, minor: dto.minor, patch: dto.patch_);
}
