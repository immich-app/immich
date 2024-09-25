import 'package:immich_mobile/entities/exif_info.entity.dart';

abstract interface class IExifInfoRepository {
  Future<ExifInfo?> get(int id);

  Future<ExifInfo> update(ExifInfo exifInfo);

  Future<void> delete(int id);
}
