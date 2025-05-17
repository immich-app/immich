import 'package:immich_mobile/domain/models/exif.model.dart';
import 'package:openapi/api.dart';

// TODO: Move to repository once all classes are refactored
abstract final class ExifDtoConverter {
  static ExifInfo fromDto(ExifResponseDto dto) {
    return ExifInfo(
      fileSize: dto.fileSizeInByte.unwrapOrNull(),
      description: dto.description.unwrapOrNull(),
      orientation: dto.orientation.unwrapOrNull(),
      timeZone: dto.timeZone.unwrapOrNull(),
      dateTimeOriginal: dto.dateTimeOriginal.unwrapOrNull(),
      isFlipped: isOrientationFlipped(dto.orientation.unwrapOrNull()),
      latitude: dto.latitude.unwrapOrNull()?.toDouble(),
      longitude: dto.longitude.unwrapOrNull()?.toDouble(),
      city: dto.city.unwrapOrNull(),
      state: dto.state.unwrapOrNull(),
      country: dto.country.unwrapOrNull(),
      make: dto.make.unwrapOrNull(),
      model: dto.model.unwrapOrNull(),
      lens: dto.lensModel.unwrapOrNull(),
      f: dto.fNumber.unwrapOrNull()?.toDouble(),
      mm: dto.focalLength.unwrapOrNull()?.toDouble(),
      iso: dto.iso.unwrapOrNull()?.toInt(),
      exposureSeconds: _exposureTimeToSeconds(dto.exposureTime.unwrapOrNull()),
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
