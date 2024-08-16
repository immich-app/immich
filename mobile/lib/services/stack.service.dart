import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/api.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:openapi/api.dart';

class StackService {
  StackService(this._api);

  final ApiService _api;

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

  Future<void> deleteStack(String stackId) async {
    try {
      return await _api.stacksApi.deleteStack(stackId);
    } catch (error) {
      debugPrint("Error while deleting stack: $error");
    }
  }
}

final stackServiceProvider = Provider(
  (ref) => StackService(
    ref.watch(apiServiceProvider),
  ),
);
