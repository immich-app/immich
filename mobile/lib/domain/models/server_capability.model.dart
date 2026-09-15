import 'package:immich_mobile/utils/semver.dart';

enum ServerCapability {
  // Feature Support
  cloudIdMetadata(SemVer(major: 2, minor: 4, patch: 0)),
  bulkCloudIdMetadata(SemVer(major: 2, minor: 5, patch: 0)),

  // Sync
  syncV2(SemVer(major: 3, minor: 0, patch: 0)),
  syncAssetEditsV1(SemVer(major: 2, minor: 6, patch: 0)),
  syncAssetFacesV2(SemVer(major: 2, minor: 6, patch: 0)),
  syncAssetOcrV1(SemVer(major: 3, minor: 0, patch: 0)),
  syncAuthUsersV2(SemVer(major: 3, minor: 3, patch: 0)),

  // Migrations
  assetPayloadChange20260128(SemVer(major: 2, minor: 5, patch: 0)),
  assetPayloadChange20260597(SemVer(major: 2, minor: 7, patch: 6));

  const ServerCapability(this.minVersion);

  final SemVer minVersion;
}

extension ServerCapabilitySupport on SemVer {
  bool supports(ServerCapability capability) => this >= capability.minVersion;
}
