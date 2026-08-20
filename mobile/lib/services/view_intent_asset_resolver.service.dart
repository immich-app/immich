import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/models/view_intent/view_intent_payload.extension.dart';
import 'package:immich_mobile/platform/native_sync_api.g.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:logging/logging.dart';

class ViewIntentResolution {
  final BaseAsset asset;
  final TimelineService timelineService;
  final bool isTrashScoped;

  final String? viewIntentFilePath;

  const ViewIntentResolution({
    required this.asset,
    required this.timelineService,
    this.isTrashScoped = false,
    this.viewIntentFilePath,
  });
}

final viewIntentAssetResolverProvider = Provider<ViewIntentAssetResolver>(
  (ref) => ViewIntentAssetResolver(
    localAssetRepository: ref.read(driftProvider).localAssetRepository,
    assetService: ref.read(assetServiceProvider),
    nativeSyncApi: ref.read(nativeSyncApiProvider),
    timelineFactory: ref.read(timelineFactoryProvider),
  ),
);

class ViewIntentAssetResolver {
  final LocalAssetRepository _localAssetRepository;
  final AssetService _assetService;
  final NativeSyncApi _nativeSyncApi;
  final TimelineFactory _timelineFactory;
  static final Logger _logger = Logger('ViewIntentAssetResolver');

  const ViewIntentAssetResolver({
    required this._localAssetRepository,
    required this._assetService,
    required this._nativeSyncApi,
    required this._timelineFactory,
  });

  Future<ViewIntentResolution> resolve(ViewIntentPayload attachment) async {
    final localAssetId = attachment.localAssetId;
    final path = attachment.path;
    _logger.fine('resolve start, localAssetId=$localAssetId, path=$path, mimeType=${attachment.mimeType}');

    if (localAssetId == null && path == null) {
      throw StateError('ViewIntent resolution requires either a localAssetId or a materialized file path.');
    }

    ({LocalAsset? asset, String? checksum}) resolvedLocal = (asset: null, checksum: null);
    if (localAssetId != null) {
      resolvedLocal = await _resolveLocalAsset(localAssetId);
      final remoteAsset = await _resolveRemoteAsset(
        localAssetId,
        remoteAssetId: resolvedLocal.asset?.remoteId,
        checksum: resolvedLocal.checksum,
      );
      if (remoteAsset != null) {
        return ViewIntentResolution(
          asset: remoteAsset,
          timelineService: _timelineFor(remoteAsset),
          isTrashScoped: remoteAsset.isTrashed,
        );
      }
    }

    final asset = resolvedLocal.asset ?? _toTransientAsset(attachment, resolvedLocal.checksum);

    return ViewIntentResolution(
      asset: asset,
      timelineService: _timelineFor(asset),
      viewIntentFilePath: resolvedLocal.asset == null ? path : null,
    );
  }

  TimelineService _timelineFor(BaseAsset asset) => _timelineFactory.fromAssets([asset], TimelineOrigin.deepLink);

  Future<({LocalAsset? asset, String? checksum})> _resolveLocalAsset(String localAssetId) async {
    final localAsset = await _localAssetRepository.get(localAssetId);
    final checksum = localAsset?.checksum ?? await _hashLocalAsset(localAssetId);

    if (checksum == null || checksum == localAsset?.checksum) {
      return (asset: localAsset, checksum: checksum);
    }

    if (localAsset != null) {
      await _localAssetRepository.updateHashes({localAssetId: checksum});
      final resolvedAsset = await _localAssetRepository.get(localAssetId);
      return (asset: resolvedAsset ?? localAsset.copyWith(checksum: checksum), checksum: checksum);
    }

    return (asset: null, checksum: checksum);
  }

  Future<String?> _hashLocalAsset(String localAssetId) async {
    try {
      final hashResults = await _nativeSyncApi.hashAssets([localAssetId]);
      if (hashResults.isEmpty) {
        return null;
      }

      final result = hashResults.first;
      if (result.error != null) {
        _logger.warning('Failed to hash view intent local asset $localAssetId: ${result.error}');
        return null;
      }
      return result.hash;
    } catch (error, stackTrace) {
      _logger.warning('Failed to hash view intent local asset $localAssetId', error, stackTrace);
      return null;
    }
  }

  Future<RemoteAsset?> _resolveRemoteAsset(
    String localAssetId, {
    required String? remoteAssetId,
    required String? checksum,
  }) async {
    RemoteAsset? remoteAsset;
    if (remoteAssetId != null) {
      remoteAsset = await _assetService.getRemoteAsset(remoteAssetId);
      if (remoteAsset != null) {
        _logger.fine('resolve matched remote asset by id: $remoteAssetId, asset=$remoteAsset');
      }
    }

    if (remoteAsset == null && checksum != null) {
      final candidates = await _assetService.getAllRemoteAssetDebugByChecksum(checksum);
      if (candidates.isNotEmpty) {
        remoteAsset = ([...candidates]..sort(_compareRemoteAssetCandidates)).first;
        _logger.fine('resolve matched remote asset by checksum: $checksum, asset=$remoteAsset');
      }
    }

    if (remoteAsset == null) {
      return null;
    }
    final asset = remoteAsset.copyWith(localId: localAssetId);
    return asset;
  }

  static int _compareRemoteAssetCandidates(RemoteAsset first, RemoteAsset second) {
    if (first.isTrashed != second.isTrashed) {
      return first.isTrashed ? 1 : -1;
    }

    final firstDate = first.uploadedAt ?? first.createdAt;
    final secondDate = second.uploadedAt ?? second.createdAt;
    final date = secondDate.compareTo(firstDate);
    return date != 0 ? date : first.id.compareTo(second.id);
  }

  LocalAsset _toTransientAsset(ViewIntentPayload attachment, String? checksum) {
    final now = DateTime.now();
    // A FileBackedAsset could model the path more explicitly, but would require broader changes to the asset hierarchy.
    return LocalAsset(
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
