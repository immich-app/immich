import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/interfaces/exif_info.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:immich_mobile/repositories/database.repository.dart';

final exifInfoRepositoryProvider =
    Provider((ref) => ExifInfoRepository(ref.watch(dbProvider)));

class ExifInfoRepository extends DataBaseRepository
    implements IExifInfoRepository {
  ExifInfoRepository(super.db);

  @override
  Future<void> delete(int id) => db.exifInfos.delete(id);

  @override
  Future<ExifInfo?> get(int id) => db.exifInfos.get(id);

  @override
  Future<ExifInfo> update(ExifInfo exifInfo) async {
    await db.writeTxn(() => db.exifInfos.put(exifInfo));
    return exifInfo;
  }

  @override
  Future<List<ExifInfo>> updateAll(List<ExifInfo> exifInfos) async {
    await db.writeTxn(() => db.exifInfos.putAll(exifInfos));
    return exifInfos;
  }
}
