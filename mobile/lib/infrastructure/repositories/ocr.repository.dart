import 'package:drift/drift.dart';
import 'package:immich_mobile/data/db/main/database.dart';
import 'package:immich_mobile/data/db/main/table/asset/ocr.drift.dart';
import 'package:immich_mobile/domain/models/ocr.model.dart';
import 'package:immich_mobile/infrastructure/repositories/ocr.repository.drift.dart';

@DriftAccessor()
class OcrRepository extends DatabaseAccessor<Drift> with $OcrRepositoryMixin {
  OcrRepository(super.attachedDatabase);

  Drift get _db => attachedDatabase;

  Future<List<Ocr>> get(String assetId) async {
    final query = _db.select(_db.assetOcrEntity)
      ..where((row) => row.assetId.equals(assetId) & row.isVisible.equals(true));

    final result = await query.get();
    return result.map((e) => e.toDto()).toList();
  }
}

extension on AssetOcrEntityData {
  Ocr toDto() {
    return Ocr(
      id: id,
      assetId: assetId,
      x1: x1,
      y1: y1,
      x2: x2,
      y2: y2,
      x3: x3,
      y3: y3,
      x4: x4,
      y4: y4,
      boxScore: boxScore,
      textScore: textScore,
      text: recognizedText,
      isVisible: isVisible,
    );
  }
}
