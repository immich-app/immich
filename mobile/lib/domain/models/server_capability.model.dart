import 'package:immich_mobile/utils/semver.dart';

enum ServerCapability {
  // Feature Support
  cloudIdMetadata(SemVer(major: 2, minor: 4, patch: 0)),
  bulkCloudIdMetadata(SemVer(major: 2, minor: 5, patch: 0)),
  assetEdits(SemVer(major: 2, minor: 6, patch: 0)),
  assetFacesV2(SemVer(major: 2, minor: 6, patch: 0)),
  syncV2(SemVer(major: 3, minor: 0, patch: 0)),
  assetOcr(SemVer(major: 3, minor: 0, patch: 0)),

  // Migrations
  assetPayloadChange20260128(SemVer(major: 2, minor: 5, patch: 0)),
  assetPayloadChange20260597(SemVer(major: 2, minor: 7, patch: 6));

  const ServerCapability(this.minVersion);

  final SemVer minVersion;
}

extension ServerCapabilitySupport on SemVer {
  bool supports(ServerCapability capability) => this >= capability.minVersion;
}
