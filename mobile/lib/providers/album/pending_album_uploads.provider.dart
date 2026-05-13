import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';

class PendingAlbumUpload {
  final LocalAsset asset;
  final double progress;
  final bool failed;

  const PendingAlbumUpload({required this.asset, this.progress = 0.0, this.failed = false});

  PendingAlbumUpload copyWith({double? progress, bool? failed}) =>
      PendingAlbumUpload(asset: asset, progress: progress ?? this.progress, failed: failed ?? this.failed);
}

class AlbumPendingUploadsNotifier extends AutoDisposeFamilyNotifier<List<PendingAlbumUpload>, String> {
  KeepAliveLink? _keepAliveLink;

  @override
  List<PendingAlbumUpload> build(String albumId) {
    ref.onDispose(() {
      _keepAliveLink?.close();
      _keepAliveLink = null;
    });

    return const [];
  }

  void enqueue(Iterable<LocalAsset> assets) {
    if (assets.isEmpty) {
      return;
    }

    final existingIds = state.map((e) => e.asset.id).toSet();
    final additions = assets.where((a) => !existingIds.contains(a.id)).map((a) => PendingAlbumUpload(asset: a));
    state = [...state, ...additions];
    _syncKeepAlive();
  }

  void updateProgress(String localAssetId, double progress) {
    state = [
      for (final entry in state)
        if (entry.asset.id == localAssetId) entry.copyWith(progress: progress, failed: false) else entry,
    ];
    _syncKeepAlive();
  }

  void markFailed(String localAssetId) {
    state = [
      for (final entry in state)
        if (entry.asset.id == localAssetId) entry.copyWith(failed: true) else entry,
    ];
    _syncKeepAlive();
  }

  void markAllFailed() {
    state = [for (final entry in state) entry.copyWith(failed: true)];
    _syncKeepAlive();
  }

  void remove(String localAssetId) {
    state = state.where((e) => e.asset.id != localAssetId).toList();
    _syncKeepAlive();
  }

  void clearFailed() {
    state = state.where((e) => !e.failed).toList();
    _syncKeepAlive();
  }

  void _syncKeepAlive() {
    if (state.isEmpty) {
      _keepAliveLink?.close();
      _keepAliveLink = null;
    } else {
      _keepAliveLink ??= ref.keepAlive();
    }
  }
}

final pendingAlbumUploadsProvider = NotifierProvider.autoDispose
    .family<AlbumPendingUploadsNotifier, List<PendingAlbumUpload>, String>(AlbumPendingUploadsNotifier.new);
