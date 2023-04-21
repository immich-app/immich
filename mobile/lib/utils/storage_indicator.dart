import 'package:flutter/material.dart';
import 'package:immich_mobile/shared/models/asset.dart';

/// Returns the suitable [IconData] to represent an [Asset]s storage location
IconData storageIcon(Asset asset) {
  switch (asset.storage) {
    case AssetState.local:
      return Icons.cloud_off_outlined;
    case AssetState.remote:
      return Icons.cloud_outlined;
    case AssetState.merged:
      return Icons.cloud_done_outlined;
  }
}
