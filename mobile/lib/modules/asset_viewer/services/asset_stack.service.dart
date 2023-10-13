import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/shared/models/asset.dart';
import 'package:immich_mobile/shared/providers/api.provider.dart';
import 'package:immich_mobile/shared/providers/asset.provider.dart';
import 'package:immich_mobile/shared/services/api.service.dart';
import 'package:openapi/api.dart';

class AssetStackService {
  AssetStackService(this._api, this._ref);

  final ApiService _api;
  final Ref _ref;

  updateStack(
    Asset parentAsset, {
    List<Asset>? childrenToAdd,
    List<Asset>? childrenToRemove,
  }) async {
    // Guard [local asset]
    if (parentAsset.remoteId == null) {
      return;
    }

    List<String> toAdd = [];
    if (childrenToAdd != null) {
      toAdd = childrenToAdd
          .where((e) => e.isRemote)
          .map((e) => e.remoteId!)
          .toList();
    }

    List<String> toRemove = [];
    if (childrenToRemove != null) {
      toRemove = childrenToRemove
          .where((e) => e.isRemote)
          .map((e) => e.remoteId!)
          .toList();
    }

    try {
      await _api.assetApi.updateStack(
        UpdateAssetStackDto(
          stackParentId: parentAsset.remoteId!,
          toAdd: toAdd,
          toRemove: toRemove,
        ),
      );

      // sync assets
      _ref.read(assetProvider.notifier).getAllAsset();
    } catch (error) {
      debugPrint("Error while updating stack children: ${error.toString()}");
    }
  }

  updateStackParent(Asset oldParent, Asset newParent) async {
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
    ref,
  ),
);
