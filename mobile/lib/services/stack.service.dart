import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/local_asset.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/repositories/asset_api.repository.dart';
import 'package:logging/logging.dart';

final stackServiceProvider = Provider(
  (ref) => StackService(ref.watch(driftProvider).localAssetRepository, ref.watch(assetApiRepositoryProvider)),
);

class StackService {
  StackService(this._localAssetRepository, this._assetApiRepository);

  final LocalAssetRepository _localAssetRepository;
  final AssetApiRepository _assetApiRepository;
  final Logger _logger = Logger('StackService');

  /// The remote asset that carried this local asset's previous checksum, if it is on the server
  Future<String?> priorRemoteId(String localId) => _localAssetRepository.getPriorRemoteId(localId);

  /// Stacks the upload of an edited local asset over the remote asset that carried its previous checksum
  Future<void> afterUpload(String localId, String remoteId) async {
    try {
      final priorId = await priorRemoteId(localId);
      if (priorId != null) {
        await _assetApiRepository.stack([remoteId, priorId]);
      }
    } catch (error) {
      _logger.warning("Failed to stack the upload of $localId: $error");
    }
  }
}
