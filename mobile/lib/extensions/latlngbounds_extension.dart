import 'package:maplibre/maplibre.dart';

extension WithinBounds on LngLatBounds {
  /// Checks whether [point] is inside bounds
  bool contains(Geographic point) {
    return containsBounds(
      LngLatBounds(
        longitudeWest: point.lon,
        longitudeEast: point.lon,
        latitudeSouth: point.lat,
        latitudeNorth: point.lat,
      ),
    );
  }

  /// Checks whether [bounds] is contained inside bounds
  bool containsBounds(LngLatBounds bounds) {
    return (bounds.latitudeSouth >= latitudeSouth) &&
        (bounds.latitudeNorth <= latitudeNorth) &&
        (bounds.longitudeWest >= longitudeWest) &&
        (bounds.longitudeEast <= longitudeEast);
  }
}
