import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/domain/services/ocr.service.dart';
import 'package:immich_mobile/infrastructure/repositories/ocr.repository.dart';
import 'package:immich_mobile/providers/infrastructure/db.provider.dart';

final ocrRepositoryProvider = Provider<OcrRepository>((ref) => OcrRepository(ref.watch(driftProvider)));

final ocrServiceProvider = Provider<OcrService>((ref) => OcrService(ref.watch(ocrRepositoryProvider)));

final ocrAssetProvider = FutureProvider.autoDispose.family<List<Ocr>?, String>((ref, assetId) async {
  final service = ref.watch(ocrServiceProvider);
  return service.get(assetId);
});
