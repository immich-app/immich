import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:openapi/api.dart';

abstract final class ExifDtoConverter {
  static ExifInfo fromDto(ExifResponseDto dto) {
    return ExifInfo(
      fileSize: dto.fileSizeInByte,
      description: dto.description,
      orientation: dto.orientation,
      timeZone: dto.timeZone,
      dateTimeOriginal: dto.dateTimeOriginal,
      isFlipped: isOrientationFlipped(dto.orientation),
      latitude: dto.latitude?.toDouble(),
      longitude: dto.longitude?.toDouble(),
      city: dto.city,
      state: dto.state,
      country: dto.country,
      make: dto.make,
      model: dto.model,
      lens: dto.lensModel,
      f: dto.fNumber?.toDouble(),
      mm: dto.focalLength?.toDouble(),
      iso: dto.iso?.toInt(),
      exposureSeconds: _exposureTimeToSeconds(dto.exposureTime),
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

  static double? _exposureTimeToSeconds(String? s) {
    if (s == null) {
      return null;
    }
    double? value = double.tryParse(s);
    if (value != null) {
      return value;
    }
    final parts = s.split("/");
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
