import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/interfaces/exif_info.interface.dart';
import 'package:immich_mobile/repositories/exif_info.repository.dart';

final exifServiceProvider =
    Provider((ref) => ExifService(ref.watch(exifInfoRepositoryProvider)));

class ExifService {
  final IExifInfoRepository _exifInfoRepository;

  ExifService(this._exifInfoRepository);

  Future<void> clearTable() {
    return _exifInfoRepository.clearTable();
  }
}
