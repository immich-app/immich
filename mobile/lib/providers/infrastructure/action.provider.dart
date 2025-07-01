import 'package:flutter/material.dart';
import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/action.service.dart';
import 'package:immich_mobile/services/timeline.service.dart';
import 'package:logging/logging.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final actionProvider = NotifierProvider<ActionNotifier, void>(
  ActionNotifier.new,
  dependencies: [
    multiSelectProvider,
    timelineServiceProvider,
  ],
);

class ActionResult {
  final int count;
  final bool success;
  final String? error;

  const ActionResult({required this.count, required this.success, this.error});

  @override
  String toString() =>
      'ActionResult(count: $count, success: $success, error: $error)';
}

class ActionNotifier extends Notifier<void> {
  final Logger _logger = Logger('ActionNotifier');
  late ActionService _service;

  ActionNotifier() : super();

  @override
  void build() {
    _service = ref.watch(actionServiceProvider);
  }

  List<String> _getIdsForSource<T extends BaseAsset>(ActionSource source) {
    final currentUser = ref.read(currentUserProvider);
    if (T is RemoteAsset && currentUser == null) {
      return [];
    }

    final Set<BaseAsset> assets = switch (source) {
      ActionSource.timeline =>
        ref.read(multiSelectProvider.select((s) => s.selectedAssets)),
      ActionSource.viewer => {},
    };

    return switch (T) {
      const (RemoteAsset) => assets
          .where(
            (asset) => asset is RemoteAsset && asset.ownerId == currentUser!.id,
          )
          .cast<RemoteAsset>()
          .map((asset) => asset.id)
          .toList(),
      const (LocalAsset) =>
        assets.whereType<LocalAsset>().map((asset) => asset.id).toList(),
      _ => [],
    };
  }

  Future<ActionResult> shareLink(
    ActionSource source,
    BuildContext context,
  ) async {
    final ids = _getIdsForSource<RemoteAsset>(source);
    try {
      await _service.shareLink(ids, context);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to create shared link for assets', error, stack);
      return ActionResult(
        count: ids.length,
        success: false,
        error: error.toString(),
      );
    }
  }

  Future<ActionResult> favorite(ActionSource source) async {
    final ids = _getIdsForSource<RemoteAsset>(source);
    try {
      await _service.favorite(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to favorite assets', error, stack);
      return ActionResult(
        count: ids.length,
        success: false,
        error: error.toString(),
      );
    }
  }

  Future<ActionResult> unFavorite(ActionSource source) async {
    final ids = _getIdsForSource<RemoteAsset>(source);
    try {
      await _service.unFavorite(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to unfavorite assets', error, stack);
      return ActionResult(
        count: ids.length,
        success: false,
        error: error.toString(),
      );
    }
  }

  Future<ActionResult> archive(ActionSource source) async {
    final ids = _getIdsForSource<RemoteAsset>(source);
    try {
      await _service.archive(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to archive assets', error, stack);
      return ActionResult(
        count: ids.length,
        success: false,
        error: error.toString(),
      );
    }
  }

  Future<ActionResult> unArchive(ActionSource source) async {
    final ids = _getIdsForSource<RemoteAsset>(source);
    try {
      await _service.unArchive(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to unarchive assets', error, stack);
      return ActionResult(
        count: ids.length,
        success: false,
        error: error.toString(),
      );
    }
  }

  Future<ActionResult> moveToLockFolder(ActionSource source) async {
    final ids = _getIdsForSource<RemoteAsset>(source);
    try {
      await _service.moveToLockFolder(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to move assets to lock folder', error, stack);
      return ActionResult(
        count: ids.length,
        success: false,
        error: error.toString(),
      );
    }
  }

  Future<ActionResult> removeFromLockFolder(ActionSource source) async {
    final ids = _getIdsForSource<RemoteAsset>(source);
    try {
      await _service.removeFromLockFolder(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to remove assets from lock folder', error, stack);
      return ActionResult(
        count: ids.length,
        success: false,
        error: error.toString(),
      );
    }
  }

  Future<ActionResult?> editLocation(
    ActionSource source,
    BuildContext context,
  ) async {
    final ids = _getIdsForSource<RemoteAsset>(source);
    try {
      final isEdited = await _service.editLocation(ids, context);
      if (!isEdited) {
        return null;
      }

      return ActionResult(count: ids.length, success: true);
    } catch (error, stack) {
      _logger.severe('Failed to edit location for assets', error, stack);
      return ActionResult(
        count: ids.length,
        success: false,
        error: error.toString(),
      );
    }
  }
}
