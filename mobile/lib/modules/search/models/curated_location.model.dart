import 'dart:convert';

class CuratedLocation {
  final String id;
  final String city;
  final String resizePath;
  final String deviceAssetId;
  final String deviceId;

  CuratedLocation({
    required this.id,
    required this.city,
    required this.resizePath,
    required this.deviceAssetId,
    required this.deviceId,
  });

  CuratedLocation copyWith({
    String? id,
    String? city,
    String? resizePath,
    String? deviceAssetId,
    String? deviceId,
  }) {
    return CuratedLocation(
      id: id ?? this.id,
      city: city ?? this.city,
      resizePath: resizePath ?? this.resizePath,
      deviceAssetId: deviceAssetId ?? this.deviceAssetId,
      deviceId: deviceId ?? this.deviceId,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'city': city,
      'resizePath': resizePath,
      'deviceAssetId': deviceAssetId,
      'deviceId': deviceId,
    };
  }

  factory CuratedLocation.fromMap(Map<String, dynamic> map) {
    return CuratedLocation(
      id: map['id'] ?? '',
      city: map['city'] ?? '',
      resizePath: map['resizePath'] ?? '',
      deviceAssetId: map['deviceAssetId'] ?? '',
      deviceId: map['deviceId'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory CuratedLocation.fromJson(String source) =>
      CuratedLocation.fromMap(json.decode(source));

  @override
  String toString() {
    return 'CuratedLocation(id: $id, city: $city, resizePath: $resizePath, deviceAssetId: $deviceAssetId, deviceId: $deviceId)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is CuratedLocation &&
        other.id == id &&
        other.city == city &&
        other.resizePath == resizePath &&
        other.deviceAssetId == deviceAssetId &&
        other.deviceId == deviceId;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        city.hashCode ^
        resizePath.hashCode ^
        deviceAssetId.hashCode ^
        deviceId.hashCode;
  }
}
