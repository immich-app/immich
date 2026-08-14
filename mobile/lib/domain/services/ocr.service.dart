import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/infrastructure/repositories/ocr.repository.dart';

class OcrService {
  final OcrRepository _repository;

  const OcrService(this._repository);

  Future<List<Ocr>?> get(String assetId) {
    return _repository.get(assetId);
  }
}
