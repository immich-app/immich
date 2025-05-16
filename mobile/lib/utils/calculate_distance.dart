import 'dart:math';

// Add method to calculate distance between two LatLng points using Haversine formula
double calculateDistance(
  double? latitude1,
  double? longitude1,
  double? latitude2,
  double? longitude2,
) {
  if (latitude1 == null ||
      longitude1 == null ||
      latitude2 == null ||
      longitude2 == null) {
    return double.maxFinite;
  }

  const int earthRadius = 6371; // Earth's radius in kilometers
  final double lat1 = latitude1 * (pi / 180);
  final double lat2 = latitude2 * (pi / 180);
  final double lon1 = longitude1 * (pi / 180);
  final double lon2 = longitude2 * (pi / 180);

  final double dLat = lat2 - lat1;
  final double dLon = lon2 - lon1;

  final double a =
      pow(sin(dLat / 2), 2) + cos(lat1) * cos(lat2) * pow(sin(dLon / 2), 2);
  final double c = 2 * atan2(sqrt(a), sqrt(1 - a));
  return earthRadius * c;
}
