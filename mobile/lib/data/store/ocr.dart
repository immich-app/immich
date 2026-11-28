import 'package:collection/collection.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/data/store/util/cache.dart';
import 'package:immich_mobile/domain/models/asset_edit.model.dart';
import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';
import 'package:immich_mobile/utils/editor.utils.dart';
import 'package:stream_transform/stream_transform.dart';

/// Text recognized within an asset
///
/// State is stored in the local DB, and is only written by sync
extension type const OcrStore._(Provider<OcrMutations> _provider) implements Provider<OcrMutations> {
  /// Internal: access through `Store.ocr`
  static final OcrStore instance = OcrStore._(Provider((ref) => OcrMutations._(ref)));

  /// The visible text recognized within the asset [assetId]
  ///
  /// **NOTE:** This is only reactive to the local DB
  AutoDisposeStreamProvider<List<Ocr>> forAsset(String assetId) => _forAssetProvider(assetId);

  /// Whether the asset [assetId] has visible text
  ///
  /// **NOTE:** This is only reactive to the local DB
  AutoDisposeStreamProvider<bool> hasText(String assetId) => _hasTextProvider(assetId);
}

final _ocrDb = driftProvider.select((db) => db.ocrRepository);
final _assetDb = driftProvider.select((db) => db.remoteAssetRepository);

final _forAssetProvider = StreamProvider.autoDispose.family<List<Ocr>, String>((ref, assetId) {
  final assetDb = ref.watch(_assetDb);
  late final exif = assetDb.watchExif(assetId).first;

  return ref
      .watch(_ocrDb)
      .watch(assetId)
      .combineLatest(assetDb.watchAssetEdits(assetId), (ocr, edits) async {
        if (ocr.isEmpty || edits.isEmpty) {
          return ocr;
        }

        return applyEditsToOcr(ocr, edits, edits.any((edit) => edit is CropEdit) ? await exif : null);
      })
      .distinct(const ListEquality<Ocr>().equals);
});

final _hasTextProvider = StreamProvider.autoDispose.family<bool, String>(
  (ref, assetId) => ref.watch(_ocrDb).watch(assetId).map((ocr) => ocr.isNotEmpty).distinct(),
);

class OcrMutations extends StoreMutations {
  const OcrMutations._(super.ref);
}
