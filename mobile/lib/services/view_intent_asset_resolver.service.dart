import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/models/view_intent/view_intent_payload.extension.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/user.provider.dart';
import 'package:logging/logging.dart';

class ViewIntentResolvedAsset {
  final BaseAsset asset;
  final TimelineService timelineService;
  final int initialIndex;
  final String? viewIntentFilePath;

  const ViewIntentResolvedAsset({
    required this.asset,
    required this.timelineService,
    required this.initialIndex,
    this.viewIntentFilePath,
  });
}

final viewIntentAssetResolverProvider = Provider<ViewIntentAssetResolver>(
  (ref) => ViewIntentAssetResolver(
    ref,
    ref.read(localAssetRepository),
    ref.read(nativeSyncApiProvider),
    ref.read(timelineFactoryProvider),
  ),
);

class ViewIntentAssetResolver {
  final Ref _ref;
  final DriftLocalAssetRepository _localAssetRepository;
  final NativeSyncApi _nativeSyncApi;
  final TimelineFactory _timelineFactory;
  static final Logger _logger = Logger('ViewIntentAssetResolver');

  const ViewIntentAssetResolver(
    this._ref,
    this._localAssetRepository,
    this._nativeSyncApi,
    this._timelineFactory,
  );

  Future<ViewIntentResolvedAsset> resolve(ViewIntentPayload attachment) async {
    final localAssetId = attachment.localAssetId;
    if (localAssetId != null) {
      var localAsset = await _localAssetRepository.getById(localAssetId);
      if (localAsset != null) {
        // Try the direct local-id match first when the intent resolves to a
        // real MediaStore asset.
        final mainTimelineAsset = await _resolveMainTimelineAssetByLocalId(localAssetId);
        if (mainTimelineAsset != null) {
          _logger.fine('presenting main timeline asset via localAssetId: ${mainTimelineAsset.asset}');
          return mainTimelineAsset;
        }

        var checksum = localAsset.checksum;
        if (checksum == null) {
          checksum = await _computeChecksumForLocalAsset(localAssetId);
          if (checksum != null) {
            localAsset = localAsset.copyWith(checksum: checksum);
          }
        }

        // If local id does not match the merged timeline, retry by checksum
        // because the same asset may already be represented there as a merged
        // local/remote asset.
        if (checksum != null) {
          final checksumTimelineAsset = await _resolveMainTimelineAssetByChecksum(checksum);
          if (checksumTimelineAsset != null) {
            _logger.fine('presenting main timeline asset via checksum fallback: ${checksumTimelineAsset.asset}');
            return checksumTimelineAsset;
          }
        }

        _logger.fine('presenting deep-link local asset: $localAsset');
        return ViewIntentResolvedAsset(
          asset: localAsset,
          timelineService: _timelineFactory.fromAssets([localAsset], TimelineOrigin.deepLink),
          initialIndex: 0,
        );
      }
    }

    final checksum = await _computeChecksum(attachment);
    if (checksum != null) {
      // Some ACTION_VIEW sources do not provide a local MediaStore id, so
      // checksum is the only way to match the incoming file to an existing
      // merged asset.
      final mainTimelineAsset = await _resolveMainTimelineAssetByChecksum(checksum);
      if (mainTimelineAsset != null) {
        _logger.fine('presenting main timeline asset via checksum-only match: ${mainTimelineAsset.asset}');
        return mainTimelineAsset;
      }
    }

    final fallbackAsset = _toViewIntentAsset(attachment, checksum);
    _logger.fine('presenting transient fallback asset: $fallbackAsset');
    return ViewIntentResolvedAsset(
      asset: fallbackAsset,
      timelineService: _timelineFactory.fromAssets([fallbackAsset], TimelineOrigin.deepLink),
      initialIndex: 0,
      viewIntentFilePath: attachment.path,
    );
  }

  Future<ViewIntentResolvedAsset?> _resolveMainTimelineAssetByLocalId(String localAssetId) async {
    final effectiveTimelineUsers = _resolveMainTimelineUsers();
    if (effectiveTimelineUsers.isEmpty) {
      return null;
    }

    final index = await _ref
        .read(timelineRepositoryProvider)
        .getMainTimelineIndexByLocalId(effectiveTimelineUsers, localAssetId);
    if (index == null) {
      return null;
    }

    return _resolveMainTimelineAssetAt(index);
  }

  Future<ViewIntentResolvedAsset?> _resolveMainTimelineAssetByChecksum(String checksum) async {
    final effectiveTimelineUsers = _resolveMainTimelineUsers();
    if (effectiveTimelineUsers.isEmpty) {
      return null;
    }

    final index = await _ref
        .read(timelineRepositoryProvider)
        .getMainTimelineIndexByChecksum(effectiveTimelineUsers, checksum);
    if (index == null) {
      return null;
    }

    return _resolveMainTimelineAssetAt(index);
  }

  List<String> _resolveMainTimelineUsers() {
    final timelineUsers = _ref.read(timelineUsersProvider).valueOrNull;
    final currentUserId = _ref.read(currentUserProvider)?.id;
    return timelineUsers ?? (currentUserId != null ? [currentUserId] : const <String>[]);
  }

  Future<ViewIntentResolvedAsset?> _resolveMainTimelineAssetAt(int index) async {
    final timelineService = _ref.read(timelineServiceProvider);
    if (timelineService.totalAssets == 0) {
      try {
        await timelineService.watchBuckets().first.timeout(const Duration(seconds: 2));
      } catch (_) {
        return null;
      }
    }

    if (index >= timelineService.totalAssets) {
      return null;
    }

    final asset = await timelineService.getAssetAsync(index);
    if (asset == null) {
      return null;
    }

    return ViewIntentResolvedAsset(asset: asset, timelineService: timelineService, initialIndex: index);
  }

  Future<String?> _computeChecksum(ViewIntentPayload attachment) async {
    final localAssetId = attachment.localAssetId;
    if (localAssetId != null) {
      return _computeChecksumForLocalAsset(localAssetId);
    }
    return _computeChecksumForPath(attachment.path);
  }

  Future<String?> _computeChecksumForLocalAsset(String localAssetId) async {
    try {
      final hashResults = await _nativeSyncApi.hashAssets([localAssetId]);
      if (hashResults.isEmpty) {
        return null;
      }
      return hashResults.first.hash;
    } catch (_) {
      return null;
    }
  }

  Future<String?> _computeChecksumForPath(String path) async {
    try {
      final hashResults = await _nativeSyncApi.hashFiles([path]);
      if (hashResults.isEmpty) {
        return null;
      }
      return hashResults.first.hash;
    } catch (_) {
      return null;
    }
  }

  LocalAsset _toViewIntentAsset(ViewIntentPayload attachment, String? checksum) {
    final now = DateTime.now();
    return LocalAsset(
      // todo Temp solution, need to provide FileBackedAsset extends BaseAsset for cover this case in right way
      id: attachment.localAssetId ?? '-${attachment.path.hashCode.abs()}',
      name: attachment.fileName,
      checksum: checksum,
      type: attachment.isVideo ? AssetType.video : AssetType.image,
      createdAt: now,
      updatedAt: now,
      isEdited: false,
      playbackStyle: attachment.playbackStyle,
    );
  }
}
