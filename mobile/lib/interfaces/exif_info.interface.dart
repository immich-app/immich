import 'package:immich_mobile/entities/exif_info.entity.dart';

abstract interface class IExifInfoRepository {
  Future<ExifInfo?> get(int id);

  Future<ExifInfo> update(ExifInfo exifInfo);

  Future<List<ExifInfo>> updateAll(List<ExifInfo> exifInfos);

  Future<void> delete(int id);
}
