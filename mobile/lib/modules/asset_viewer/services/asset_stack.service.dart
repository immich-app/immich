import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:openapi/api.dart';

class AssetStackService {
  AssetStackService(this._api);

  final ApiService _api;

  updateStack(
    Asset parentAsset, {
    List<String>? childrenToAdd,
    List<String>? childrenToRemove,
  }) async {
    // Guard [local asset]
    if (parentAsset.remoteId == null) {
      return;
    }

    try {
      await _api.assetApi.updateStack(
        UpdateAssetStackDto(
          stackParentId: parentAsset.remoteId!,
          toAdd: childrenToAdd ?? [],
          toRemove: childrenToRemove ?? [],
        ),
      );
    } catch (error) {
      debugPrint("Error while updating stack children: ${error.toString()}");
    }
  }
}

final assetStackServiceProvider = Provider(
  (ref) => AssetStackService(
    ref.watch(apiServiceProvider),
  ),
);
