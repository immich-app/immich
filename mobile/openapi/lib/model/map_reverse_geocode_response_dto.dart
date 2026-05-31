// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class MapReverseGeocodeResponseDto {
  const MapReverseGeocodeResponseDto({required this.city, required this.country, required this.state});

  /// City name
  final String? city;

  /// Country name
  final String? country;

  /// State/Province name
  final String? state;

  static const _undefined = Object();

  static MapReverseGeocodeResponseDto? fromJson(dynamic value) {
    ApiCompat.upgrade<MapReverseGeocodeResponseDto>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      city: (json[r'city'] as String?),
      country: (json[r'country'] as String?),
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
    if (state != null) {
      json[r'state'] = state!;
    }
    return json;
  }

  MapReverseGeocodeResponseDto copyWith({
    Object? city = _undefined,
    Object? country = _undefined,
    Object? state = _undefined,
  }) {
    return .new(
      city: identical(city, _undefined) ? this.city : city as String?,
      country: identical(country, _undefined) ? this.country : country as String?,
      state: identical(state, _undefined) ? this.state : state as String?,
    );
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is MapReverseGeocodeResponseDto &&
            city == other.city &&
            country == other.country &&
            state == other.state);
  }

  @override
  int get hashCode {
    return Object.hashAll([city, country, state]);
  }

  @override
  String toString() => 'MapReverseGeocodeResponseDto(city=$city, country=$country, state=$state)';
}
