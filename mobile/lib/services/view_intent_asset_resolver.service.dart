import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/asset.service.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
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

  final String? viewIntentFilePath;

  const ViewIntentResolvedAsset({required this.asset, required this.timelineService, this.viewIntentFilePath});
}

final viewIntentAssetResolverProvider = Provider<ViewIntentAssetResolver>(
  (ref) => ViewIntentAssetResolver(
    localAssetRepository: ref.read(localAssetRepository),
    assetService: ref.read(assetServiceProvider),
    nativeSyncApi: ref.read(nativeSyncApiProvider),
    timelineFactory: ref.read(timelineFactoryProvider),
  ),
);

class ViewIntentAssetResolver {
  final DriftLocalAssetRepository _localAssetRepository;
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

  Future<ViewIntentResolvedAsset> resolve(ViewIntentPayload attachment) async {
    final localAssetId = attachment.localAssetId;
    final path = attachment.path;
    _logger.fine('resolve start, localAssetId=$localAssetId, path=$path, mimeType=${attachment.mimeType}');

    if (localAssetId == null && path == null) {
      throw StateError('ViewIntent resolution requires either a localAssetId or a materialized file path.');
    }

    ({LocalAsset? asset, String? checksum}) resolvedLocal = (asset: null, checksum: null);
    if (localAssetId != null) {
      resolvedLocal = await _resolveLocalAsset(localAssetId);
      final remoteAsset = await _resolveRemoteAsset(localAssetId, resolvedLocal.checksum);
      if (remoteAsset != null) {
        return ViewIntentResolvedAsset(asset: remoteAsset, timelineService: timelineFor(remoteAsset));
      }
    }

    final asset = resolvedLocal.asset ?? _toTransientAsset(attachment, resolvedLocal.checksum);

    return ViewIntentResolvedAsset(
      asset: asset,
      timelineService: timelineFor(asset),
      viewIntentFilePath: resolvedLocal.asset == null ? path : null,
    );
  }

  TimelineService timelineFor(BaseAsset asset) {
    final origin = asset is RemoteAsset && asset.isTrashed ? TimelineOrigin.deepLinkTrash : TimelineOrigin.deepLink;
    return _timelineFactory.fromAssets([asset], origin);
  }

  Future<({LocalAsset? asset, String? checksum})> _resolveLocalAsset(String localAssetId) async {
    final localAsset = await _localAssetRepository.getById(localAssetId);
    final checksum = localAsset?.checksum ?? await _hashLocalAsset(localAssetId);

    if (checksum == null || checksum == localAsset?.checksum) {
      return (asset: localAsset, checksum: checksum);
    }

    if (localAsset != null) {
      await _localAssetRepository.updateHashes({localAssetId: checksum});
    }

    return (asset: localAsset?.copyWith(checksum: checksum), checksum: checksum);
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

  Future<RemoteAsset?> _resolveRemoteAsset(String localAssetId, String? checksum) async {
    if (checksum == null) {
      return null;
    }

    final remoteAsset = await _assetService.getRemoteAssetByChecksum(checksum);
    if (remoteAsset == null) {
      return null;
    }

    final asset = remoteAsset.copyWith(localId: localAssetId);
    _logger.fine('resolve matched remote asset by checksum: $checksum, asset=$asset');
    return asset;
  }

  LocalAsset _toTransientAsset(ViewIntentPayload attachment, String? checksum) {
    final now = DateTime.now();
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
