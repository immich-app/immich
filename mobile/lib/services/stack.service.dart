import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/interfaces/asset.interface.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/repositories/asset.repository.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:openapi/api.dart';

class StackService {
  StackService(this._api, this._assetRepository);

  final ApiService _api;
  final IAssetRepository _assetRepository;

  Future<StackResponseDto?> getStack(String stackId) async {
    try {
      return _api.stacksApi.getStack(stackId);
    } catch (error) {
      debugPrint("Error while fetching stack: $error");
    }
    return null;
  }

  Future<StackResponseDto?> createStack(List<String> assetIds) async {
    try {
      return _api.stacksApi.createStack(
        StackCreateDto(assetIds: assetIds),
      );
    } catch (error) {
      debugPrint("Error while creating stack: $error");
    }
    return null;
  }

  Future<StackResponseDto?> updateStack(
    String stackId,
    String primaryAssetId,
  ) async {
    try {
      return await _api.stacksApi.updateStack(
        stackId,
        StackUpdateDto(primaryAssetId: primaryAssetId),
      );
    } catch (error) {
      debugPrint("Error while updating stack children: $error");
    }
    return null;
  }

  Future<void> deleteStack(String stackId, List<Asset> assets) async {
    try {
      await _api.stacksApi.deleteStack(stackId);

      // Update local database to trigger rerendering
      final List<Asset> removeAssets = [];
      for (final asset in assets) {
        asset.stackId = null;
        asset.stackPrimaryAssetId = null;
        asset.stackCount = 0;

        removeAssets.add(asset);
      }
      await _assetRepository
          .transaction(() => _assetRepository.updateAll(removeAssets));
    } catch (error) {
      debugPrint("Error while deleting stack: $error");
    }
  }
}

final stackServiceProvider = Provider(
  (ref) => StackService(
    ref.watch(apiServiceProvider),
    ref.watch(assetRepositoryProvider),
  ),
);
