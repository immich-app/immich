import 'package:easy_localization/easy_localization.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/entities/asset.entity.dart';

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

String storageText(Asset asset) {
  switch (asset.storage) {
    case AssetState.local:
      return "storage_asset_local".tr();
    case AssetState.remote:
      return "storage_asset_remote".tr();
    case AssetState.merged:
      return "storage_asset_merged".tr();
  }
}
