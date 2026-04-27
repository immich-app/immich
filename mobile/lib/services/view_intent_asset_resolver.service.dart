import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/timeline.repository.dart';
import 'package:immich_mobile/models/view_intent/view_intent_payload.extension.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
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
    localAssetRepository: ref.read(localAssetRepository),
    nativeSyncApi: ref.read(nativeSyncApiProvider),
    timelineFactory: ref.read(timelineFactoryProvider),
    timelineRepository: ref.read(timelineRepositoryProvider),
  ),
);

class ViewIntentAssetResolver {
  final DriftLocalAssetRepository _localAssetRepository;
  final NativeSyncApi _nativeSyncApi;
  final TimelineFactory _timelineFactory;
  final DriftTimelineRepository _timelineRepository;
  static final Logger _logger = Logger('ViewIntentAssetResolver');

  const ViewIntentAssetResolver({
    required DriftLocalAssetRepository localAssetRepository,
    required NativeSyncApi nativeSyncApi,
    required TimelineFactory timelineFactory,
    required DriftTimelineRepository timelineRepository,
  }) : _localAssetRepository = localAssetRepository,
       _nativeSyncApi = nativeSyncApi,
       _timelineFactory = timelineFactory,
       _timelineRepository = timelineRepository;

  Future<ViewIntentResolvedAsset> resolve(
    ViewIntentPayload attachment, {
    required List<String> timelineUsers,
    required TimelineService mainTimelineService,
  }) async {
    final localAssetId = attachment.localAssetId;
    final path = attachment.path;
    _logger.fine('resolve start, localAssetId=$localAssetId, path=$path, mimeType=${attachment.mimeType}');
    if (localAssetId == null && path == null) {
      throw StateError('ViewIntent resolution requires either a localAssetId or a materialized file path.');
    }

    if (localAssetId != null) {
      // Try the direct local-id match first when the intent resolves to a real
      // MediaStore asset.
      final mainTimelineAsset = await _resolveMainTimelineAssetByLocalId(
        localAssetId,
        timelineUsers,
        mainTimelineService,
      );
      if (mainTimelineAsset != null) {
        _logger.fine('presenting main timeline asset via localAssetId: ${mainTimelineAsset.asset}');
        return mainTimelineAsset;
      }
    }

    final localAsset = localAssetId != null ? await _localAssetRepository.getById(localAssetId) : null;
    _logger.fine('resolve local asset loaded: $localAsset');

    final checksum = await _resolveChecksumForMatching(attachment, localAsset: localAsset);
    _logger.fine('resolve checksum for matching: $checksum');
    if (checksum != null) {
      final mainTimelineAsset = await _resolveMainTimelineAssetByChecksum(checksum, timelineUsers, mainTimelineService);
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

  Future<ViewIntentResolvedAsset?> _resolveMainTimelineAssetByLocalId(
    String localAssetId,
    List<String> timelineUsers,
    TimelineService mainTimelineService,
  ) async {
    _logger.fine('resolve main timeline by localId start: $localAssetId');
    return _resolveMainTimelineAsset(
      () => _timelineRepository.getMainTimelineIndexByLocalId(timelineUsers, localAssetId),
      timelineUsers: timelineUsers,
      mainTimelineService: mainTimelineService,
      lookupLabel: 'localId=$localAssetId',
    );
  }

  Future<ViewIntentResolvedAsset?> _resolveMainTimelineAssetByChecksum(
    String checksum,
    List<String> timelineUsers,
    TimelineService mainTimelineService,
  ) async {
    // Some ACTION_VIEW sources do not provide a local MediaStore id, so
    // checksum is the only way to match the incoming file to an existing
    // merged asset.
    _logger.fine('resolve main timeline by checksum start: $checksum');
    return _resolveMainTimelineAsset(
      () => _timelineRepository.getMainTimelineIndexByChecksum(timelineUsers, checksum),
      timelineUsers: timelineUsers,
      mainTimelineService: mainTimelineService,
      lookupLabel: 'checksum=$checksum',
    );
  }

  Future<ViewIntentResolvedAsset?> _resolveMainTimelineAsset(
    Future<int?> Function() findIndex, {
    required List<String> timelineUsers,
    required TimelineService mainTimelineService,
    required String lookupLabel,
  }) async {
    _logger.fine('resolve main timeline users for $lookupLabel: $timelineUsers');
    if (timelineUsers.isEmpty) {
      _logger.fine('resolve main timeline aborted for $lookupLabel: timelineUsers is empty');
      return null;
    }

    final index = await findIndex();
    _logger.fine('resolve main timeline index for $lookupLabel: $index');
    if (index == null) {
      return null;
    }

    return _resolveMainTimelineAssetAt(index, mainTimelineService);
  }

  Future<ViewIntentResolvedAsset?> _resolveMainTimelineAssetAt(int index, TimelineService timelineService) async {
    _logger.fine(
      'resolve main timeline asset at index start: index=$index, origin=${timelineService.origin}, totalAssets=${timelineService.totalAssets}',
    );
    if (!timelineService.isReady) {
      try {
        await waitForTimelineReady(timelineService, const Duration(seconds: 3));
      } catch (_) {
        return null;
      }
    }

    BaseAsset? asset;
    final deadline = DateTime.now().add(const Duration(seconds: 3));
    while (DateTime.now().isBefore(deadline)) {
      if (index < timelineService.totalAssets) {
        asset = await timelineService.getAssetAsync(index);
        if (asset != null) {
          break;
        }
      }
      await Future<void>.delayed(const Duration(milliseconds: 100));
    }
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
