import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/remote_asset.repository.dart';
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
  final String? viewIntentFilePath;

  const ViewIntentResolution({required this.asset, required this.timelineService, this.viewIntentFilePath});
}

final viewIntentAssetResolverProvider = Provider<ViewIntentAssetResolver>(
  (ref) => ViewIntentAssetResolver(
    localAssetRepository: ref.read(driftProvider).localAssetRepository,
    nativeSyncApi: ref.read(nativeSyncApiProvider),
    timelineFactory: ref.read(timelineFactoryProvider),
    remoteAssetRepository: ref.read(driftProvider).remoteAssetRepository,
    timelineUsers: () => ref.read(timelineUsersProvider.future),
  ),
);

class ViewIntentAssetResolver {
  final LocalAssetRepository _localAssetRepository;
  final NativeSyncApi _nativeSyncApi;
  final TimelineFactory _timelineFactory;
  final RemoteAssetRepository _remoteAssetRepository;
  final Future<List<String>> Function() _timelineUsers;
  static final Logger _logger = Logger('ViewIntentAssetResolver');

  const ViewIntentAssetResolver({
    required this._localAssetRepository,
    required this._nativeSyncApi,
    required this._timelineFactory,
    required this._remoteAssetRepository,
    required this._timelineUsers,
  });

  Future<ViewIntentResolution> resolve(ViewIntentPayload attachment) async {
    final localAssetId = attachment.localAssetId;
    final path = attachment.path;
    _logger.fine('resolve start, localAssetId=$localAssetId, path=$path, mimeType=${attachment.mimeType}');

    if (localAssetId == null && path == null) {
      throw StateError('ViewIntent resolution requires either a localAssetId or a materialized file path.');
    }

    final localAsset = localAssetId == null ? null : await _localAssetRepository.getById(localAssetId);
    final checksum = localAsset?.checksum ?? (localAssetId == null ? null : await _hashLocalAsset(localAssetId));
    if (localAsset != null && localAsset.checksum == null && checksum != null) {
      await _localAssetRepository.updateHashes({localAsset.id: checksum});
    }

    final remoteAsset = checksum == null
        ? null
        : await _remoteAssetRepository.getCounterpartByChecksum(
            await _timelineUsers(),
            checksum,
            // An existing local row is linked to the user's own asset in any visibility.
            ownInAnyVisibility: localAsset != null,
          );
    if (remoteAsset != null) {
      _logger.fine('resolve matched remote asset by checksum: $checksum, asset=$remoteAsset');
      return _resolution(remoteAsset.copyWith(localId: localAssetId));
    }

    if (localAsset != null) {
      return _resolution(localAsset.copyWith(checksum: checksum));
    }

    return _resolution(_toTransientAsset(attachment, checksum), viewIntentFilePath: path);
  }

  ViewIntentResolution _resolution(BaseAsset asset, {String? viewIntentFilePath}) => ViewIntentResolution(
    asset: asset,
    timelineService: _timelineFactory.fromAssets([asset], TimelineOrigin.deepLink),
    viewIntentFilePath: viewIntentFilePath,
  );

  Future<String?> _hashLocalAsset(String localAssetId) async {
    try {
      final result = (await _nativeSyncApi.hashAssets([localAssetId])).firstOrNull;
      if (result == null) {
        return null;
      }
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
