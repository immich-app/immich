// AUTO-GENERATED FILE, DO NOT MODIFY!
//
part of openapi.api;

final class SyncAlbumUserV1 {
  const SyncAlbumUserV1({required this.albumId, required this.role, required this.userId});

  /// Album ID
  final String albumId;

  final AlbumUserRole role;

  /// User ID
  final String userId;

  static SyncAlbumUserV1? fromJson(dynamic value) {
    ApiCompat.upgrade<SyncAlbumUserV1>(value);
    if (value is! Map) return null;
    final json = value.cast<String, dynamic>();
    return .new(
      albumId: json[r'albumId'] as String,
      role: (AlbumUserRole.fromJson(json[r'role']))!,
      userId: json[r'userId'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    final json = <String, dynamic>{};
    json[r'albumId'] = albumId;
    json[r'role'] = role.toJson();
    json[r'userId'] = userId;
    return json;
  }

  SyncAlbumUserV1 copyWith({String? albumId, AlbumUserRole? role, String? userId}) {
    return .new(albumId: albumId ?? this.albumId, role: role ?? this.role, userId: userId ?? this.userId);
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other is SyncAlbumUserV1 && albumId == other.albumId && role == other.role && userId == other.userId);
  }

  @override
  int get hashCode {
    return Object.hashAll([albumId, role, userId]);
  }

  @override
  String toString() => 'SyncAlbumUserV1(albumId=$albumId, role=$role, userId=$userId)';
}
