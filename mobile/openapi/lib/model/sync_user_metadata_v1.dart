// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncUserMetadataV1 {
  const SyncUserMetadataV1({required this.key, required this.userId, required this.value});

  final UserMetadataKey key;

  /// User ID
  final String userId;

  /// User metadata value
  final Map<String, dynamic> value;

  static SyncUserMetadataV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncUserMetadataV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      key: (UserMetadataKey.fromJson(json[r'key']))!,
      userId: json[r'userId'] as String,
      value: ((json[r'value'] as Map?)?.cast<String, dynamic>())!,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'key'] = key.toJson();
    json[r'userId'] = userId;
    json[r'value'] = value;
    return json;
  }

  SyncUserMetadataV1 copyWith({UserMetadataKey? key, String? userId, Map<String, dynamic>? value}) {
    return .new(key: key ?? this.key, userId: userId ?? this.userId, value: value ?? this.value);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncUserMetadataV1 &&
            key == other.key &&
            userId == other.userId &&
            const DeepCollectionEquality().equals(value, other.value));
  }

  @override
  int get hashCode {
    return Object.hashAll([key, userId, const DeepCollectionEquality().hash(value)]);
  }

  @override
  String toString() => 'SyncUserMetadataV1(key=$key, userId=$userId, value=$value)';
}
