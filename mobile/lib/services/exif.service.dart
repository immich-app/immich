import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/infrastructure/repositories/exif.repository.dart';
import 'package:immich_mobile/providers/infrastructure/exif.provider.dart';

final exifServiceProvider =
    Provider((ref) => ExifService(ref.watch(exifRepositoryProvider)));

class ExifService {
  final IsarExifRepository _exifInfoRepository;

  const ExifService(this._exifInfoRepository);

  Future<void> clearTable() {
    return _exifInfoRepository.deleteAll();
  }
}
