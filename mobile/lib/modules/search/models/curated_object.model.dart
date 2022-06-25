import 'dart:convert';

class CuratedObject {
  final String id;
  final String object;
  final String resizePath;
  final String deviceAssetId;
  final String deviceId;
  CuratedObject({
    required this.id,
    required this.object,
    required this.resizePath,
    required this.deviceAssetId,
    required this.deviceId,
  });

  CuratedObject copyWith({
    String? id,
    String? object,
    String? resizePath,
    String? deviceAssetId,
    String? deviceId,
  }) {
    return CuratedObject(
      id: id ?? this.id,
      object: object ?? this.object,
      resizePath: resizePath ?? this.resizePath,
      deviceAssetId: deviceAssetId ?? this.deviceAssetId,
      deviceId: deviceId ?? this.deviceId,
    );
  }

  Map<String, dynamic> toMap() {
    final result = <String, dynamic>{};

    result.addAll({'id': id});
    result.addAll({'object': object});
    result.addAll({'resizePath': resizePath});
    result.addAll({'deviceAssetId': deviceAssetId});
    result.addAll({'deviceId': deviceId});

    return result;
  }

  factory CuratedObject.fromMap(Map<String, dynamic> map) {
    return CuratedObject(
      id: map['id'] ?? '',
      object: map['object'] ?? '',
      resizePath: map['resizePath'] ?? '',
      deviceAssetId: map['deviceAssetId'] ?? '',
      deviceId: map['deviceId'] ?? '',
    );
  }

  String toJson() => json.encode(toMap());

  factory CuratedObject.fromJson(String source) =>
      CuratedObject.fromMap(json.decode(source));

  @override
  String toString() {
    return 'CuratedObject(id: $id, object: $object, resizePath: $resizePath, deviceAssetId: $deviceAssetId, deviceId: $deviceId)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is CuratedObject &&
        other.id == id &&
        other.object == object &&
        other.resizePath == resizePath &&
        other.deviceAssetId == deviceAssetId &&
        other.deviceId == deviceId;
  }

  @override
  int get hashCode {
    return id.hashCode ^
        object.hashCode ^
        resizePath.hashCode ^
        deviceAssetId.hashCode ^
        deviceId.hashCode;
  }
}
