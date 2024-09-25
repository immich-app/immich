import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/entities/exif_info.entity.dart';
import 'package:immich_mobile/interfaces/exif_info.interface.dart';
import 'package:immich_mobile/providers/db.provider.dart';
import 'package:isar/isar.dart';

final exifInfoRepositoryProvider =
    Provider((ref) => ExifInfoRepository(ref.watch(dbProvider)));

class ExifInfoRepository implements IExifInfoRepository {
  final Isar _db;

  ExifInfoRepository(
    this._db,
  );

  @override
  Future<void> delete(int id) => _db.exifInfos.delete(id);

  @override
  Future<ExifInfo?> get(int id) => _db.exifInfos.get(id);

  @override
  Future<ExifInfo> update(ExifInfo exifInfo) async {
    await _db.writeTxn(() => _db.exifInfos.put(exifInfo));
    return exifInfo;
  }
}
