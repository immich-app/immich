// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncUserDeleteV1 {
  const SyncUserDeleteV1({required this.userId});

  /// User ID
  final String userId;

  static SyncUserDeleteV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncUserDeleteV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(userId: json[r'userId'] as String);
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'userId'] = userId;
    return json;
  }

  SyncUserDeleteV1 copyWith({String? userId}) {
    return .new(userId: userId ?? this.userId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) || (other is SyncUserDeleteV1 && userId == other.userId);
  }

  @override
  int get hashCode {
    return Object.hashAll([userId]);
  }

  @override
  String toString() => 'SyncUserDeleteV1(userId=$userId)';
}
