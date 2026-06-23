import 'dart:convert';

import 'package:immich_mobile/domain/models/asset/asset_metadata.model.dart';
import 'package:immich_mobile/extensions/platform_extensions.dart';

/// The iOS mobile-app metadata multipart field, shared by the foreground and
/// background upload paths so the payload only has one definition. null when
/// there's nothing to attach. Pass [adjustmentTime] only for an edited render;
/// the unedited base carries none.
String? cloudMetadataJson({
  required String? cloudId,
  required DateTime createdAt,
  String? adjustmentTime,
  String? latitude,
  String? longitude,
}) {
  if (!CurrentPlatform.isIOS || cloudId == null) {
    return null;
  }
  return jsonEncode([
    RemoteAssetMetadataItem(
      key: RemoteAssetMetadataKey.mobileApp,
      value: RemoteAssetMobileAppMetadata(
        cloudId: cloudId,
        createdAt: createdAt.toIso8601String(),
        adjustmentTime: adjustmentTime,
        latitude: latitude,
        longitude: longitude,
      ),
    ),
  ]);
}
