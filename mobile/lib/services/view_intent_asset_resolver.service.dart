import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/models/view_intent/view_intent_payload.extension.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/asset_viewer/main_timeline_handoff.provider.dart';
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

  const ViewIntentAssetResolver(this._ref, this._localAssetRepository, this._nativeSyncApi, this._timelineFactory);

  Future<ViewIntentResolvedAsset> resolve(ViewIntentPayload attachment) async {
    final localAssetId = attachment.localAssetId;
    final path = attachment.path;
    _logger.fine('resolve start, localAssetId=$localAssetId, path=$path, mimeType=${attachment.mimeType}');
    if (localAssetId == null && path == null) {
      throw StateError('ViewIntent resolution requires either a localAssetId or a materialized file path.');
    }

    final localAsset = localAssetId != null ? await _localAssetRepository.getById(localAssetId) : null;
    _logger.fine('resolve local asset loaded: $localAsset');

    if (localAssetId != null) {
      // Try the direct local-id match first when the intent resolves to a real
      // MediaStore asset.
      final mainTimelineAsset = await _resolveMainTimelineAssetByLocalId(localAssetId);
      if (mainTimelineAsset != null) {
        _logger.fine('presenting main timeline asset via localAssetId: ${mainTimelineAsset.asset}');
        return mainTimelineAsset;
      }
    }

    final checksum = await _resolveChecksumForMatching(attachment, localAsset: localAsset);
    _logger.fine('resolve checksum for matching: $checksum');
    if (checksum != null) {
      final mainTimelineAsset = await _resolveMainTimelineAssetByChecksum(checksum);
      if (mainTimelineAsset != null) {
        final lookupType = localAssetId != null ? 'checksum fallback' : 'checksum-only match';
        _logger.fine('presenting main timeline asset via $lookupType: ${mainTimelineAsset.asset}');
        return mainTimelineAsset;
      }
    }

    final fallbackAsset = _toFallbackAsset(attachment, localAsset: localAsset, checksum: checksum);
    if (localAsset != null) {
      _logger.fine('resolve fallback to deep-link local asset: $fallbackAsset');
    } else {
      _logger.fine('resolve fallback to transient deep-link asset: $fallbackAsset');
    }

    return ViewIntentResolvedAsset(
      asset: fallbackAsset,
      timelineService: _timelineFactory.fromAssets([fallbackAsset], TimelineOrigin.deepLink),
      initialIndex: 0,
      viewIntentFilePath: localAsset == null ? path : null,
    );
  }

  Future<ViewIntentResolvedAsset?> _resolveMainTimelineAssetByLocalId(String localAssetId) async {
    _logger.fine('resolve main timeline by localId start: $localAssetId');
    return _resolveMainTimelineAsset(
      (effectiveTimelineUsers) =>
          _ref.read(timelineRepositoryProvider).getMainTimelineIndexByLocalId(effectiveTimelineUsers, localAssetId),
      lookupLabel: 'localId=$localAssetId',
    );
  }

  Future<ViewIntentResolvedAsset?> _resolveMainTimelineAssetByChecksum(String checksum) async {
    // Some ACTION_VIEW sources do not provide a local MediaStore id, so
    // checksum is the only way to match the incoming file to an existing
    // merged asset.
    _logger.fine('resolve main timeline by checksum start: $checksum');
    return _resolveMainTimelineAsset(
      (effectiveTimelineUsers) =>
          _ref.read(timelineRepositoryProvider).getMainTimelineIndexByChecksum(effectiveTimelineUsers, checksum),
      lookupLabel: 'checksum=$checksum',
    );
  }

  Future<ViewIntentResolvedAsset?> _resolveMainTimelineAsset(
    Future<int?> Function(List<String> effectiveTimelineUsers) findIndex, {
    required String lookupLabel,
  }) async {
    final effectiveTimelineUsers = _resolveMainTimelineUsers();
    _logger.fine('resolve main timeline users for $lookupLabel: $effectiveTimelineUsers');
    if (effectiveTimelineUsers.isEmpty) {
      _logger.fine('resolve main timeline aborted for $lookupLabel: effectiveTimelineUsers is empty');
      return null;
    }

    final index = await findIndex(effectiveTimelineUsers);
    _logger.fine('resolve main timeline index for $lookupLabel: $index');
    if (index == null) {
      return null;
    }

    return _resolveMainTimelineAssetAt(index);
  }

  List<String> _resolveMainTimelineUsers() {
    final timelineUsers = _ref.read(timelineUsersProvider).valueOrNull;
    final currentUserId = _ref.read(currentUserProvider)?.id;
    final effectiveTimelineUsers = timelineUsers != null && timelineUsers.isNotEmpty
        ? timelineUsers
        : (currentUserId != null ? [currentUserId] : const <String>[]);
    _logger.fine(
      'resolve main timeline users source, timelineUsers=$timelineUsers, currentUserId=$currentUserId, effective=$effectiveTimelineUsers',
    );
    return effectiveTimelineUsers;
  }

  Future<ViewIntentResolvedAsset?> _resolveMainTimelineAssetAt(int index) async {
    final timelineService = _ref.read(timelineServiceProvider);
    _logger.fine(
      'resolve main timeline asset at index start: index=$index, origin=${timelineService.origin}, totalAssets=${timelineService.totalAssets}',
    );
    final asset = await MainTimelineHandoffCoordinator.resolveAssetFromMainTimelineService(timelineService, index);
    _logger.fine(
      'resolve main timeline asset at index result: index=$index, totalAssetsAfterWait=${timelineService.totalAssets}, asset=$asset',
    );
    if (asset == null) {
      return null;
    }

    return ViewIntentResolvedAsset(asset: asset, timelineService: timelineService, initialIndex: index);
  }

  Future<String?> _resolveChecksumForMatching(ViewIntentPayload attachment, {LocalAsset? localAsset}) async {
    final localChecksum = localAsset?.checksum;
    if (localChecksum != null) {
      _logger.fine('resolve checksum from local db: $localChecksum');
      return localChecksum;
    }

    final localAssetId = attachment.localAssetId;
    if (localAssetId != null) {
      _logger.fine('resolve checksum by hashing local asset: $localAssetId');
      return _computeChecksumForLocalAsset(localAssetId);
    }
    final path = attachment.path;
    if (path == null) {
      _logger.fine('resolve checksum aborted: path is null');
      return null;
    }
    _logger.fine('resolve checksum by hashing path: $path');
    return _computeChecksumForPath(path);
  }

  Future<String?> _computeChecksumForLocalAsset(String localAssetId) async {
    try {
      final hashResults = await _nativeSyncApi.hashAssets([localAssetId]);
      if (hashResults.isEmpty) {
        _logger.fine('compute checksum for local asset returned empty: $localAssetId');
        return null;
      }
      _logger.fine('compute checksum for local asset succeeded: $localAssetId -> ${hashResults.first.hash}');
      return hashResults.first.hash;
    } catch (error, stackTrace) {
      _logger.warning('compute checksum for local asset failed: $localAssetId', error, stackTrace);
      return null;
    }
  }

  Future<String?> _computeChecksumForPath(String path) async {
    try {
      final hashResults = await _nativeSyncApi.hashFiles([path]);
      if (hashResults.isEmpty) {
        _logger.fine('compute checksum for path returned empty: $path');
        return null;
      }
      _logger.fine('compute checksum for path succeeded: $path -> ${hashResults.first.hash}');
      return hashResults.first.hash;
    } catch (error, stackTrace) {
      _logger.warning('compute checksum for path failed: $path', error, stackTrace);
      return null;
    }
  }

  LocalAsset _toFallbackAsset(ViewIntentPayload attachment, {LocalAsset? localAsset, String? checksum}) {
    if (localAsset == null) {
      return _toViewIntentAsset(attachment, checksum);
    }

    if (checksum == null || checksum == localAsset.checksum) {
      return localAsset;
    }

    return localAsset.copyWith(checksum: checksum);
  }

  LocalAsset _toViewIntentAsset(ViewIntentPayload attachment, String? checksum) {
    final now = DateTime.now();
    return LocalAsset(
      // todo Temp solution, need to provide FileBackedAsset extends BaseAsset for cover this case in right way
      id: attachment.localAssetId ?? '-${attachment.path!.hashCode.abs()}',
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
