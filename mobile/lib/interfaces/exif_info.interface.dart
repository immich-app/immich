import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/interfaces/database.interface.dart';

abstract interface class IExifInfoRepository implements IDatabaseRepository {
  Future<ExifInfo?> get(int id);

  Future<ExifInfo> update(ExifInfo exifInfo);

  Future<List<ExifInfo>> updateAll(List<ExifInfo> exifInfos);

  Future<void> delete(int id);
}
