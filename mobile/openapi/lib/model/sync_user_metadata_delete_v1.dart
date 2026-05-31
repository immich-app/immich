// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncUserMetadataDeleteV1 {
  const SyncUserMetadataDeleteV1({required this.key, required this.userId});

  final UserMetadataKey key;

  /// User ID
  final String userId;

  static SyncUserMetadataDeleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncUserMetadataDeleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(key: (UserMetadataKey.fromJson(json[r'key']))!, userId: json[r'userId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'key'] = key.toJson();
    json[r'userId'] = userId;
    return json;
  }

  SyncUserMetadataDeleteV1 copyWith({UserMetadataKey? key, String? userId}) {
    return .new(key: key ?? this.key, userId: userId ?? this.userId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SyncUserMetadataDeleteV1 && key == other.key && userId == other.userId);
  }

  @override
  int get hashCode {
    return Object.hashAll([key, userId]);
  }

  @override
  String toString() => 'SyncUserMetadataDeleteV1(key=$key, userId=$userId)';
}
