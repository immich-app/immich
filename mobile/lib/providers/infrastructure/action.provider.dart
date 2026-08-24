// ignore_for_file: use-ref-and-state-synchronously

import 'dart:async';

import 'package:auto_route/auto_route.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/asset_viewer/asset_viewer.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/action.service.dart';
import 'package:logging/logging.dart';

final actionProvider = NotifierProvider<ActionNotifier, void>(ActionNotifier.new, dependencies: [multiSelectProvider]);

class ActionResult {
  final int count;
  final bool success;
  final String? error;
  final List<String> remoteAssetIds;

  const ActionResult({required this.count, required this.success, this.error, this.remoteAssetIds = const []});

  @override
  String toString() => 'ActionResult(count: $count, success: $success, error: $error, remoteAssetIds: $remoteAssetIds)';
}

class ActionNotifier extends Notifier<void> {
  final Logger _logger = Logger('ActionNotifier');
  late ActionService _service;

  ActionNotifier() : super();

  @override
  void build() {
    _service = ref.watch(actionServiceProvider);
  }

  List<String> _getRemoteIdsForSource(ActionSource source) {
    return _getAssets(source).whereType<RemoteAsset>().toIds().toList(growable: false);
  }

  Set<BaseAsset> _getAssets(ActionSource source) {
    return switch (source) {
      ActionSource.timeline => ref.read(multiSelectProvider).selectedAssets,
      ActionSource.viewer => switch (ref.read(assetViewerProvider).currentAsset) {
        final BaseAsset asset => {asset},
        null => const {},
      },
    };
  }

  Future<ActionResult> troubleshoot(ActionSource source, BuildContext context) async {
    final assets = _getAssets(source);
    if (assets.length > 1) {
      return ActionResult(count: assets.length, success: false, error: 'Cannot troubleshoot multiple assets');
    }
    unawaited(context.pushRoute(AssetTroubleshootRoute(asset: assets.first)));

    return ActionResult(count: assets.length, success: true);
  }

  Future<ActionResult> emptyTrash(String userId) async {
    try {
      final count = await _service.emptyTrash(userId);
      return ActionResult(count: count, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to empty trash', error, stack);
      return ActionResult(count: 0, success: false, error: error.toString());
    }
  }

  Future<ActionResult> restoreAllTrash(String userId) async {
    try {
      final count = await _service.restoreAllTrash(userId);
      return ActionResult(count: count, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to restore all trash assets', error, stack);
      return ActionResult(count: 0, success: false, error: error.toString());
    }
  }

  Future<ActionResult> updateDescription(ActionSource source, String description) async {
    final ids = _getRemoteIdsForSource(source);
    if (ids.length != 1) {
      _logger.warning('updateDescription called with multiple assets, expected single asset');
      return ActionResult(count: ids.length, success: false, error: 'Expected single asset for description update');
    }

    try {
      final isUpdated = await _service.updateDescription(ids.first, description);
      return ActionResult(count: 1, success: isUpdated);
    } catch (error, stack) {
      _logger.severe('Failed to update description for asset', error, stack);
      return ActionResult(count: 1, success: false, error: error.toString());
    }
  }

  Future<ActionResult> updateRating(ActionSource source, int? rating) async {
    final ids = _getRemoteIdsForSource(source);
    if (ids.length != 1) {
      _logger.warning('updateRating called with multiple assets, expected single asset');
      return ActionResult(count: ids.length, success: false, error: 'Expected single asset for rating update');
    }

    try {
      final isUpdated = await _service.updateRating(ids.first, rating);
      return ActionResult(count: 1, success: isUpdated);
    } catch (error, stack) {
      _logger.severe('Failed to update rating for asset', error, stack);
      return ActionResult(count: 1, success: false, error: error.toString());
    }
  }
}

extension on Iterable<RemoteAsset> {
  Iterable<String> toIds() => map((e) => e.id);
}
