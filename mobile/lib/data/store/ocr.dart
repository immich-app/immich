import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store/util/cache.dart';
import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

/// Text recognized within an asset
///
/// State is stored in the local DB, and is only written by sync
extension type const OcrStore._(Provider<OcrMutations> _provider) implements Provider<OcrMutations> {
  /// Internal: access through `Store.ocr`
  static final OcrStore instance = OcrStore._(Provider((ref) => OcrMutations._(ref)));

  /// The visible text recognized within the asset [assetId]
  ///
  /// **NOTE:** This is not reactive to changes, and only hits the local DB
  AutoDisposeFutureProvider<List<Ocr>> forAsset(String assetId) => _forAssetProvider(assetId);
}

final _ocrDb = driftProvider.select((db) => db.ocrRepository);

final _forAssetProvider = FutureProvider.autoDispose.family<List<Ocr>, String>(
  (ref, assetId) => ref.watch(_ocrDb).get(assetId),
);

class OcrMutations extends StoreMutations {
  const OcrMutations._(super.ref);
}
