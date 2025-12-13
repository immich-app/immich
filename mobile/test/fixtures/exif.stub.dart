import 'package:immich_mobile/domain/models/exif.model.dart';

abstract final class ExifStub {
  static final size = const ExifInfo(assetId: 1, fileSize: 1000);

  static final gps = const ExifInfo(
    assetId: 2,
    latitude: 20,
    longitude: 20,
    city: 'city',
    state: 'state',
    country: 'country',
  );

  static final rotated90CW = const ExifInfo(assetId: 3, orientation: "90");

  static final rotated270CW = const ExifInfo(assetId: 4, orientation: "-90");
}
