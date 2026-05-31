// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MapMarkerResponseDto {
  const MapMarkerResponseDto({
    required this.city,
    required this.country,
    required this.id,
    required this.lat,
    required this.lon,
    required this.state,
  });

  /// City name
  final String? city;

  /// Country name
  final String? country;

  /// Asset ID
  final String id;

  /// Latitude
  final double lat;

  /// Longitude
  final double lon;

  /// State/Province name
  final String? state;

  static const _undefined = Object();

  static MapMarkerResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<MapMarkerResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      city: (json[r'city'] as String?),
      country: (json[r'country'] as String?),
      id: json[r'id'] as String,
      lat: (json[r'lat'] as num).toDouble(),
      lon: (json[r'lon'] as num).toDouble(),
      state: (json[r'state'] as String?),
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (city != null) {
      json[r'city'] = city!;
    }
    if (country != null) {
      json[r'country'] = country!;
    }
    json[r'id'] = id;
    json[r'lat'] = lat;
    json[r'lon'] = lon;
    if (state != null) {
      json[r'state'] = state!;
    }
    return json;
  }

  MapMarkerResponseDto copyWith({
    Object? city = _undefined,
    Object? country = _undefined,
    String? id,
    double? lat,
    double? lon,
    Object? state = _undefined,
  }) {
    return .new(
      city: identical(city, _undefined) ? this.city : city as String?,
      country: identical(country, _undefined) ? this.country : country as String?,
      id: id ?? this.id,
      lat: lat ?? this.lat,
      lon: lon ?? this.lon,
      state: identical(state, _undefined) ? this.state : state as String?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is MapMarkerResponseDto &&
            city == other.city &&
            country == other.country &&
            id == other.id &&
            lat == other.lat &&
            lon == other.lon &&
            state == other.state);
  }

  @override
  int get hashCode {
    return Object.hashAll([city, country, id, lat, lon, state]);
  }

  @override
  String toString() => 'MapMarkerResponseDto(city=$city, country=$country, id=$id, lat=$lat, lon=$lon, state=$state)';
}
