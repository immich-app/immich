import 'package:immich_mobile/utils/semver.dart';

enum ServerCapability {
  // Sync
  syncAssetFacesV3(SemVer(major: 3, minor: 3, patch: 0)),
  syncAuthUsersV2(SemVer(major: 3, minor: 3, patch: 0)),
  syncMemoriesV2(SemVer(major: 3, minor: 3, patch: 0));

  const ServerCapability(this.minVersion);

  final SemVer minVersion;
}

extension ServerCapabilitySupport on SemVer {
  bool supports(ServerCapability capability) => this >= capability.minVersion;
}
