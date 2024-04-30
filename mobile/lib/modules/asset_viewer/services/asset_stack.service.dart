import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:openapi/api.dart';

class AssetStackService {
  AssetStackService(this._api);

  final ApiService _api;

  Future<void> updateStack(
    Asset parentAsset, {
    List<Asset>? childrenToAdd,
    List<Asset>? childrenToRemove,
  }) async {
    // Guard [local asset]
    if (parentAsset.remoteId == null) {
      return;
    }

    try {
      if (childrenToAdd != null) {
        final toAdd = childrenToAdd
            .where((e) => e.isRemote)
            .map((e) => e.remoteId!)
            .toList();

        await _api.assetApi.updateAssets(
          AssetBulkUpdateDto(ids: toAdd, stackParentId: parentAsset.remoteId),
        );
      }

      if (childrenToRemove != null) {
        final toRemove = childrenToRemove
            .where((e) => e.isRemote)
            .map((e) => e.remoteId!)
            .toList();
        await _api.assetApi.updateAssets(
          AssetBulkUpdateDto(ids: toRemove, removeParent: true),
        );
      }
    } catch (error) {
      debugPrint("Error while updating stack children: ${error.toString()}");
    }
  }

  Future<void> updateStackParent(Asset oldParent, Asset newParent) async {
    // Guard [local asset]
    if (oldParent.remoteId == null || newParent.remoteId == null) {
      return;
    }

    try {
      await _api.assetApi.updateStackParent(
        UpdateStackParentDto(
          oldParentId: oldParent.remoteId!,
          newParentId: newParent.remoteId!,
        ),
      );
    } catch (error) {
      debugPrint("Error while updating stack parent: ${error.toString()}");
    }
  }
}

final assetStackServiceProvider = Provider(
  (ref) => AssetStackService(
    ref.watch(apiServiceProvider),
  ),
);
