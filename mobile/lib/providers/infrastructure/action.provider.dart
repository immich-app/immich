import 'package:immich_mobile/constants/enums.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/multiselect.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:immich_mobile/services/action.service.dart';
import 'package:logging/logging.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

final actionProvider = NotifierProvider<ActionNotifier, void>(
  ActionNotifier.new,
  dependencies: [
    actionServiceProvider,
    timelineServiceProvider,
    multiselectProvider,
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
  late final ActionService _service;

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

  Future<ActionResult> favorite(ActionSource source) async {
    final ids = _getIdsForSource<RemoteAsset>(source);
    if (ids.isEmpty) {
      return const ActionResult(
        count: 0,
        success: false,
        error: 'No assets to favorite',
      );
    }

    try {
      await _service.favorite(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (e, s) {
      _logger.severe('Failed to favorite assets', e, s);
      return ActionResult(
        count: ids.length,
        success: false,
        error: e.toString(),
      );
    }
  }

  Future<ActionResult> unFavorite(ActionSource source) async {
    final ids = _getIdsForSource<RemoteAsset>(source);
    if (ids.isEmpty) {
      return const ActionResult(
        count: 0,
        success: false,
        error: 'No assets to unfavorite',
      );
    }

    try {
      await _service.unFavorite(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (e, s) {
      _logger.severe('Failed to unfavorite assets', e, s);
      return ActionResult(
        count: ids.length,
        success: false,
        error: e.toString(),
      );
    }
  }

  Future<ActionResult> archive(ActionSource source) async {
    final ids = _getIdsForSource<RemoteAsset>(source);
    if (ids.isEmpty) {
      return const ActionResult(
        count: 0,
        success: false,
        error: 'No assets to archive',
      );
    }

    try {
      await _service.archive(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (e, s) {
      _logger.severe('Failed to archive assets', e, s);
      return ActionResult(
        count: ids.length,
        success: false,
        error: e.toString(),
      );
    }
  }

  Future<ActionResult> unArchive(ActionSource source) async {
    final ids = _getIdsForSource<RemoteAsset>(source);
    if (ids.isEmpty) {
      return const ActionResult(
        count: 0,
        success: false,
        error: 'No assets to unarchive',
      );
    }

    try {
      await _service.unArchive(ids);
      return ActionResult(count: ids.length, success: true);
    } catch (e, s) {
      _logger.severe('Failed to unarchive assets', e, s);
      return ActionResult(
        count: ids.length,
        success: false,
        error: e.toString(),
      );
    }
  }
}
