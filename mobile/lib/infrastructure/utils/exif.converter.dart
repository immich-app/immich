import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:openapi/api.dart';

// TODO: Move to repository once all classes are refactored
abstract final class ExifDtoConverter {
  static ExifInfo fromDto(ExifResponseDto dto) {
    return ExifInfo(
      fileSize: dto.fileSizeInByte.orElse(null),
      description: dto.description.orElse(null),
      orientation: dto.orientation.orElse(null),
      timeZone: dto.timeZone.orElse(null),
      dateTimeOriginal: dto.dateTimeOriginal.orElse(null),
      isFlipped: isOrientationFlipped(dto.orientation.orElse(null)),
      latitude: dto.latitude.orElse(null)?.toDouble(),
      longitude: dto.longitude.orElse(null)?.toDouble(),
      city: dto.city.orElse(null),
      state: dto.state.orElse(null),
      country: dto.country.orElse(null),
      make: dto.make.orElse(null),
      model: dto.model.orElse(null),
      lens: dto.lensModel.orElse(null),
      f: dto.fNumber.orElse(null)?.toDouble(),
      mm: dto.focalLength.orElse(null)?.toDouble(),
      iso: dto.iso.orElse(null)?.toInt(),
      exposureSeconds: exposureTimeToSeconds(dto.exposureTime.orElse(null)),
      projectionType: dto.projectionType.orElse(null),
    );
  }

  static bool isOrientationFlipped(String? orientation) {
    final value = orientation == null ? null : int.tryParse(orientation);
    if (value == null) {
      return false;
    }
    final isRotated90CW = value == 5 || value == 6 || value == 90;
    final isRotated270CW = value == 7 || value == 8 || value == -90;
    return isRotated90CW || isRotated270CW;
  }

  static double? exposureTimeToSeconds(String? second) {
    if (second == null) {
      return null;
    }
    double? value = double.tryParse(second);
    if (value != null) {
      return value;
    }
    final parts = second.split("/");
    if (parts.length == 2) {
      final numerator = double.tryParse(parts.firstOrNull ?? "-");
      final denominator = double.tryParse(parts.lastOrNull ?? "-");
      if (numerator != null && denominator != null) {
        return numerator / denominator;
      }
    }
    return null;
  }
}
