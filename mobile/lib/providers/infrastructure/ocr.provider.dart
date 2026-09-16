import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/domain/services/ocr.service.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final ocrAssetProvider = FutureProvider.autoDispose.family<List<Ocr>?, String>((ref, assetId) async {
  final service = OcrService(ref.watch(driftProvider).ocrRepository);
  return service.get(assetId);
});
