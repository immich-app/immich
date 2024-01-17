import 'package:maplibre_gl/maplibre_gl.dart';

extension WithinBounds on LatLngBounds {
  /// Checks whether [point] is inside bounds
  bool contains(LatLng point) {
    final sw = point;
    final ne = point;
    return containsBounds(LatLngBounds(southwest: sw, northeast: ne));
  }

  /// Checks whether [bounds] is contained inside bounds
  bool containsBounds(LatLngBounds bounds) {
    final sw = bounds.southwest;
    final ne = bounds.northeast;
    return (sw.latitude >= southwest.latitude) &&
        (ne.latitude <= northeast.latitude) &&
        (sw.longitude >= southwest.longitude) &&
        (ne.longitude <= northeast.longitude);
  }
}
