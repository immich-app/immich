import 'package:immich_mobile/domain/interfaces/db.interface.dart';
import 'package:immich_mobile/domain/models/exif.model.dart';

abstract interface class IExifInfoRepository implements IDatabaseRepository {
  Future<ExifInfo?> get(int assetId);

  Future<ExifInfo> update(ExifInfo exifInfo);

  Future<List<ExifInfo>> updateAll(List<ExifInfo> exifInfos);

  Future<void> delete(int assetId);

  Future<void> deleteAll();
}
