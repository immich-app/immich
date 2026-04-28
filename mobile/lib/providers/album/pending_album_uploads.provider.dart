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

class AlbumPendingUploadsNotifier extends FamilyNotifier<List<PendingAlbumUpload>, String> {
  @override
  List<PendingAlbumUpload> build(String albumId) => const [];

  void enqueue(Iterable<LocalAsset> assets) {
    if (assets.isEmpty) return;
    final existingIds = state.map((e) => e.asset.id).toSet();
    final additions = assets.where((a) => !existingIds.contains(a.id)).map((a) => PendingAlbumUpload(asset: a));
    state = [...state, ...additions];
  }

  void updateProgress(String localAssetId, double progress) {
    state = [
      for (final entry in state)
        if (entry.asset.id == localAssetId) entry.copyWith(progress: progress, failed: false) else entry,
    ];
  }

  void markFailed(String localAssetId) {
    state = [
      for (final entry in state)
        if (entry.asset.id == localAssetId) entry.copyWith(failed: true) else entry,
    ];
  }

  void remove(String localAssetId) {
    state = state.where((e) => e.asset.id != localAssetId).toList();
  }

  void clearFailed() {
    state = state.where((e) => !e.failed).toList();
  }
}

final pendingAlbumUploadsProvider =
    NotifierProvider.family<AlbumPendingUploadsNotifier, List<PendingAlbumUpload>, String>(
      AlbumPendingUploadsNotifier.new,
    );
