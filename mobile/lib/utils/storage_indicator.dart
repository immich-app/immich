import 'package:flutter/material.dart';
import 'package:immich_mobile/entities/asset.entity.dart';

/// Returns the suitable [IconData] to represent an [Asset]s storage location
IconData storageIcon(Asset asset) => switch (asset.storage) {
      AssetState.local => Icons.cloud_off_outlined,
      AssetState.remote => Icons.cloud_outlined,
      AssetState.merged => Icons.cloud_done_outlined,
    };
