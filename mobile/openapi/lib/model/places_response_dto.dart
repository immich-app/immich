// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class PlacesResponseDto {
  const PlacesResponseDto({
    this.admin1name,
    this.admin2name,
    required this.latitude,
    required this.longitude,
    required this.name,
  });

  /// Administrative level 1 name (state/province)
  final String? admin1name;

  /// Administrative level 2 name (county/district)
  final String? admin2name;

  /// Latitude coordinate
  final double latitude;

  /// Longitude coordinate
  final double longitude;

  /// Place name
  final String name;

  static const _undefined = Object();

  static PlacesResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<PlacesResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      admin1name: (json[r'admin1name'] as String?),
      admin2name: (json[r'admin2name'] as String?),
      latitude: (json[r'latitude'] as num).toDouble(),
      longitude: (json[r'longitude'] as num).toDouble(),
      name: json[r'name'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    if (admin1name != null) {
      json[r'admin1name'] = admin1name!;
    }
    if (admin2name != null) {
      json[r'admin2name'] = admin2name!;
    }
    json[r'latitude'] = latitude;
    json[r'longitude'] = longitude;
    json[r'name'] = name;
    return json;
  }

  PlacesResponseDto copyWith({
    Object? admin1name = _undefined,
    Object? admin2name = _undefined,
    double? latitude,
    double? longitude,
    String? name,
  }) {
    return .new(
      admin1name: identical(admin1name, _undefined) ? this.admin1name : admin1name as String?,
      admin2name: identical(admin2name, _undefined) ? this.admin2name : admin2name as String?,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      name: name ?? this.name,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is PlacesResponseDto &&
            admin1name == other.admin1name &&
            admin2name == other.admin2name &&
            latitude == other.latitude &&
            longitude == other.longitude &&
            name == other.name);
  }

  @override
  int get hashCode {
    return Object.hashAll([admin1name, admin2name, latitude, longitude, name]);
  }

  @override
  String toString() =>
      'PlacesResponseDto(admin1name=$admin1name, admin2name=$admin2name, latitude=$latitude, longitude=$longitude, name=$name)';
}
