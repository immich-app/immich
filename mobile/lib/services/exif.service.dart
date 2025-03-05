import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/interfaces/exif.interface.dart';
import 'package:immich_mobile/providers/infrastructure/exif.provider.dart';

final exifServiceProvider =
    Provider((ref) => ExifService(ref.watch(exifRepositoryProvider)));

class ExifService {
  final IExifInfoRepository _exifInfoRepository;

  const ExifService(this._exifInfoRepository);

  Future<void> clearTable() {
    return _exifInfoRepository.deleteAll();
  }
}
