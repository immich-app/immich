import 'dart:convert';

class PlaceResult {
  /// The label to show associated with this curated object
  final String label;

  /// The id to lookup the asset from the server
  final String id;

  /// The latitude of the location
  final double latitude;

  /// The longitude of the location
  final double longitude;

  PlaceResult({
    required this.label,
    required this.id,
    required this.latitude,
    required this.longitude,
  });

  PlaceResult copyWith({
    String? label,
    String? id,
    double? latitude,
    double? longitude,
  }) {
    return PlaceResult(
      label: label ?? this.label,
      id: id ?? this.id,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
    );
  }

  Map<String, dynamic> toMap() {
    return <String, dynamic>{
      'label': label,
      'id': id,
      'latitude': latitude,
      'longitude': longitude,
    };
  }

  factory PlaceResult.fromMap(Map<String, dynamic> map) {
    return PlaceResult(
      label: map['label'] as String,
      id: map['id'] as String,
      latitude: map['latitude'] as double,
      longitude: map['longitude'] as double,
    );
  }

  String toJson() => json.encode(toMap());

  factory PlaceResult.fromJson(String source) =>
      PlaceResult.fromMap(json.decode(source) as Map<String, dynamic>);

  @override
  String toString() =>
      'CuratedContent(label: $label, id: $id, latitude: $latitude, longitude: $longitude)';

  @override
  bool operator ==(covariant PlaceResult other) {
    if (identical(this, other)) return true;

    return other.label == label &&
        other.id == id &&
        other.latitude == latitude &&
        other.longitude == longitude;
  }

  @override
  int get hashCode =>
      label.hashCode ^ id.hashCode ^ latitude.hashCode ^ longitude.hashCode;
}
