import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/models/view_intent/view_intent_payload.extension.dart';
import 'package:immich_mobile/platform/view_intent_api.g.dart';
import 'package:immich_mobile/providers/infrastructure/asset.provider.dart';
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
    timelineFactory: ref.read(timelineFactoryProvider),
  ),
);

class ViewIntentAssetResolver {
  final DriftLocalAssetRepository _localAssetRepository;
  final TimelineFactory _timelineFactory;
  static final Logger _logger = Logger('ViewIntentAssetResolver');

  const ViewIntentAssetResolver({required this._localAssetRepository, required this._timelineFactory});

  Future<ViewIntentResolvedAsset> resolve(ViewIntentPayload attachment) async {
    final localAssetId = attachment.localAssetId;
    final path = attachment.path;
    _logger.fine('resolve start, localAssetId=$localAssetId, path=$path, mimeType=${attachment.mimeType}');

    if (localAssetId == null && path == null) {
      throw StateError('ViewIntent resolution requires either a localAssetId or a materialized file path.');
    }

    final localAsset = localAssetId != null ? await _localAssetRepository.getById(localAssetId) : null;
    final asset = localAsset ?? _toTransientAsset(attachment);

    return ViewIntentResolvedAsset(
      asset: asset,
      timelineService: _timelineFactory.fromAssets([asset], TimelineOrigin.deepLink),
      viewIntentFilePath: localAsset == null ? path : null,
    );
  }

  LocalAsset _toTransientAsset(ViewIntentPayload attachment) {
    final now = DateTime.now();
    return LocalAsset(
      id: attachment.localAssetId ?? '-${attachment.path!.hashCode.abs()}',
      name: attachment.fileName,
      type: attachment.isVideo ? AssetType.video : AssetType.image,
      createdAt: now,
      updatedAt: now,
      isEdited: false,
      playbackStyle: attachment.playbackStyle,
    );
  }
}
